import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChannelGroup } from "./channels";
import { DEFAULT_CHANNEL_GROUPS } from "./channels";
import { loadChannelGroups, saveChannelGroups } from "./channelStorage";

type ChannelContextValue = {
  groups: ChannelGroup[];
  setGroups: (next: ChannelGroup[] | ((prev: ChannelGroup[]) => ChannelGroup[])) => void;
  resetToFactoryDefault: () => void;
};

const ChannelContext = createContext<ChannelContextValue | null>(null);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [groups, setGroupsState] = useState<ChannelGroup[]>(() =>
    loadChannelGroups()
  );

  const setGroups = useCallback(
    (next: ChannelGroup[] | ((prev: ChannelGroup[]) => ChannelGroup[])) => {
      setGroupsState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        saveChannelGroups(resolved);
        return resolved;
      });
    },
    []
  );

  const resetToFactoryDefault = useCallback(() => {
    const fresh = JSON.parse(
      JSON.stringify(DEFAULT_CHANNEL_GROUPS)
    ) as ChannelGroup[];
    saveChannelGroups(fresh);
    setGroupsState(fresh);
  }, []);

  const value = useMemo(
    () => ({ groups, setGroups, resetToFactoryDefault }),
    [groups, setGroups, resetToFactoryDefault]
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
