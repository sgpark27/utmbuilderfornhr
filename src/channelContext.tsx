import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChannelGroup } from "./channels";
import { DEFAULT_CHANNEL_GROUPS } from "./channels";
import {
  isCentralChannelMode,
  fetchChannelGroupsFromServer,
  putChannelGroupsToServer,
} from "./apiChannels";
import { loadChannelGroups, saveChannelGroups } from "./channelStorage";

type ChannelContextValue = {
  groups: ChannelGroup[];
  setGroups: (
    next: ChannelGroup[] | ((prev: ChannelGroup[]) => ChannelGroup[])
  ) => void;
  resetToFactoryDefault: () => void;
  channelsLoading: boolean;
  channelsLoadError: string | null;
  lastSaveError: string | null;
  clearLastSaveError: () => void;
};

const ChannelContext = createContext<ChannelContextValue | null>(null);

const central = isCentralChannelMode();

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [groups, setGroupsState] = useState<ChannelGroup[]>(() =>
    central ? [] : loadChannelGroups()
  );
  const [channelsLoading, setChannelsLoading] = useState(central);
  const [channelsLoadError, setChannelsLoadError] = useState<string | null>(
    null
  );
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!central) return;
    let cancelled = false;
    (async () => {
      setChannelsLoading(true);
      setChannelsLoadError(null);
      const { groups: g, error } = await fetchChannelGroupsFromServer();
      if (cancelled) return;
      setGroupsState(g);
      if (error) setChannelsLoadError(error);
      setChannelsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setGroups = useCallback(
    (
      next: ChannelGroup[] | ((prev: ChannelGroup[]) => ChannelGroup[])
    ) => {
      setGroupsState((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (p: ChannelGroup[]) => ChannelGroup[])(prev)
            : next;
        if (central) {
          setLastSaveError(null);
          void (async () => {
            const { ok, error } = await putChannelGroupsToServer(resolved);
            if (!ok) {
              setLastSaveError(
                error === "no_credentials"
                  ? "서버에 저장하려면 채널 관리에서 관리자로 로그인한 뒤 다시 시도해 주세요."
                  : error
              );
              setGroupsState(prev);
            }
          })();
        } else {
          saveChannelGroups(resolved);
        }
        return resolved;
      });
    },
    []
  );

  const resetToFactoryDefault = useCallback(() => {
    const fresh = JSON.parse(
      JSON.stringify(DEFAULT_CHANNEL_GROUPS)
    ) as ChannelGroup[];
    if (central) {
      setLastSaveError(null);
      setGroupsState(fresh);
      void (async () => {
        const { ok, error } = await putChannelGroupsToServer(fresh);
        if (!ok) {
          setLastSaveError(
            error === "no_credentials"
              ? "서버에 반영하려면 관리자로 로그인한 뒤 다시 시도해 주세요."
              : error
          );
          const { groups: g } = await fetchChannelGroupsFromServer();
          setGroupsState(g);
        }
      })();
    } else {
      saveChannelGroups(fresh);
      setGroupsState(fresh);
    }
  }, []);

  const clearLastSaveError = useCallback(() => setLastSaveError(null), []);

  const value = useMemo(
    () => ({
      groups,
      setGroups,
      resetToFactoryDefault,
      channelsLoading,
      channelsLoadError,
      lastSaveError,
      clearLastSaveError,
    }),
    [
      groups,
      setGroups,
      resetToFactoryDefault,
      channelsLoading,
      channelsLoadError,
      lastSaveError,
      clearLastSaveError,
    ]
  );

  return (
    <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
  );
}

export function useChannelGroups(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error("useChannelGroups must be used within ChannelProvider");
  }
  return ctx;
}
