import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { ChannelGroup, ChannelLeaf } from "../channels";
import {
  clearAdminSession,
  isAdminConfigured,
  isAdminSession,
  setAdminCredsForApi,
  setAdminSession,
  verifyAdminCredentials,
} from "../adminAuth";
import { isCentralChannelMode } from "../apiChannels";
import { useChannelGroups } from "../channelContext";
import { SiteFooter } from "../SiteFooter";

function newGroupId(): string {
  return `grp_${Date.now().toString(36)}`;
}

function newLeafId(): string {
  return `leaf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(() => isAdminSession());
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const {
    groups,
    setGroups,
    resetToFactoryDefault,
    lastSaveError,
    clearLastSaveError,
  } = useChannelGroups();
  const centralChannels = isCentralChannelMode();
  const [resetConfirm, setResetConfirm] = useState(false);

  const configured = useMemo(() => isAdminConfigured(), []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!verifyAdminCredentials(loginId.trim(), loginPw)) {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    setAdminCredsForApi(loginId.trim(), loginPw);
    setAdminSession();
    setLoggedIn(true);
    setLoginPw("");
  };

  const handleLogout = () => {
    clearAdminSession();
    setLoggedIn(false);
  };

  const updateGroup = (groupId: string, patch: Partial<ChannelGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g))
    );
  };

  const removeGroup = (groupId: string) => {
    if (!window.confirm("이 대분류와 포함된 소분류를 모두 삭제할까요?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addGroup = () => {
    const id = newGroupId();
    setGroups((prev) => [
      ...prev,
      {
        id,
        label: "새 매체",
        children: [],
      },
    ]);
  };

  const addLeaf = (groupId: string) => {
    const leaf: ChannelLeaf = {
      id: newLeafId(),
      label: "새 소분류",
      utm_source: "source",
      utm_medium: "medium",
      utm_content: "content",
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, children: [...g.children, leaf] } : g
      )
    );
  };

  const updateLeaf = (
    groupId: string,
    leafId: string,
    patch: Partial<ChannelLeaf>
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          children: g.children.map((c) =>
            c.id === leafId ? { ...c, ...patch } : c
          ),
        };
      })
    );
  };

  const removeLeaf = (groupId: string, leafId: string) => {
    if (!window.confirm("이 소분류를 삭제할까요?")) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, children: g.children.filter((c) => c.id !== leafId) }
          : g
      )
    );
  };

  const handleFactoryReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      window.setTimeout(() => setResetConfirm(false), 5000);
      return;
    }
    resetToFactoryDefault();
    setResetConfirm(false);
  };

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
        <header className="border-b border-zinc-800 bg-black shadow-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-6 sm:px-6">
            <h1 className="text-lg font-semibold text-white">채널 관리</h1>
            <Link
              to="/"
              className="text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
            >
              홈으로
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6">
          {!configured && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              관리자 계정이 설정되지 않았습니다. 프로젝트 루트에{" "}
              <code className="rounded bg-amber-100 px-1">.env.local</code> 파일을
              만들고{" "}
              <code className="rounded bg-amber-100 px-1">VITE_ADMIN_ID</code>,{" "}
              <code className="rounded bg-amber-100 px-1">
                VITE_ADMIN_PASSWORD
              </code>
              를 설정한 뒤 개발 서버를 다시 시작하세요.
            </p>
          )}
          <form
            onSubmit={handleLogin}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block text-sm font-medium text-slate-700">
              ID
              <input
                type="text"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              비밀번호
              <input
                type="password"
                autoComplete="current-password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            {loginError && (
              <p className="mt-2 text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              로그인
            </button>
          </form>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <header className="border-b border-zinc-800 bg-black shadow-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <h1 className="text-lg font-semibold text-white">채널 관리</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
            >
              UTM Builder로
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {centralChannels && (
          <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            <strong>중앙 저장 모드</strong>입니다. 여기서 저장하면 서버(
            <code className="rounded bg-sky-100 px-1">channel_groups.json</code>
            )에 기록되며, 모든 방문자에게 같은 채널 목록이 보입니다.
          </p>
        )}
        {lastSaveError && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            <span>저장 실패: {lastSaveError}</span>
            <button
              type="button"
              onClick={clearLastSaveError}
              className="shrink-0 text-red-600 underline"
            >
              닫기
            </button>
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addGroup}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            대분류 추가
          </button>
          <button
            type="button"
            onClick={handleFactoryReset}
            className={`rounded-lg border px-4 py-2 text-sm font-medium shadow-sm ${
              resetConfirm
                ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {resetConfirm
              ? "한 번 더 누르면 코드 기본값으로 초기화됩니다"
              : "코드 기본값으로 초기화"}
          </button>
        </div>

        <p className="mb-6 text-xs text-slate-500">
          {centralChannels
            ? "서버에 반영이 안 되면 PythonAnywhere Web 탭의 Reload와 환경 변수(UTM_BUILDER_*)를 확인하세요."
            : "변경 사항은 이 브라우저의 localStorage에 저장됩니다. 다른 PC·브라우저와는 공유되지 않습니다."}
        </p>

        <ul className="space-y-6">
          {groups.map((group) => (
            <li
              key={group.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  대분류 ID (영문·숫자·_)
                  <input
                    value={group.id}
                    onChange={(e) =>
                      updateGroup(group.id, { id: e.target.value.trim() })
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  표시명
                  <input
                    value={group.label}
                    onChange={(e) =>
                      updateGroup(group.id, { label: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  파비콘 도메인 (선택)
                  <input
                    value={group.faviconDomain ?? ""}
                    onChange={(e) =>
                      updateGroup(group.id, {
                        faviconDomain: e.target.value.trim() || undefined,
                      })
                    }
                    placeholder="www.example.com"
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  파비콘 없을 때
                  <select
                    value={group.faviconFallback ?? ""}
                    onChange={(e) =>
                      updateGroup(group.id, {
                        faviconFallback:
                          e.target.value === ""
                            ? undefined
                            : (e.target.value as "mail" | "initial"),
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="">첫 글자 뱃지</option>
                    <option value="mail">메일 아이콘</option>
                    <option value="initial">첫 글자(명시)</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addLeaf(group.id)}
                  className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
                >
                  소분류 추가
                </button>
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  대분류 삭제
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-2 py-2 font-medium text-slate-600">
                        소분류 ID
                      </th>
                      <th className="px-2 py-2 font-medium text-slate-600">
                        표시명
                      </th>
                      <th className="px-2 py-2 font-medium text-slate-600">
                        utm_source
                      </th>
                      <th className="px-2 py-2 font-medium text-slate-600">
                        utm_medium
                      </th>
                      <th className="px-2 py-2 font-medium text-slate-600">
                        utm_content
                      </th>
                      <th className="w-14 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.children.map((leaf) => (
                      <tr key={leaf.id} className="border-b border-slate-50">
                        <td className="px-2 py-1.5">
                          <input
                            value={leaf.id}
                            onChange={(e) =>
                              updateLeaf(group.id, leaf.id, {
                                id: e.target.value.trim(),
                              })
                            }
                            className="w-full min-w-[100px] rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={leaf.label}
                            onChange={(e) =>
                              updateLeaf(group.id, leaf.id, {
                                label: e.target.value,
                              })
                            }
                            className="w-full min-w-[100px] rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={leaf.utm_source}
                            onChange={(e) =>
                              updateLeaf(group.id, leaf.id, {
                                utm_source: e.target.value.trim(),
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={leaf.utm_medium}
                            onChange={(e) =>
                              updateLeaf(group.id, leaf.id, {
                                utm_medium: e.target.value.trim(),
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={leaf.utm_content ?? ""}
                            onChange={(e) =>
                              updateLeaf(group.id, leaf.id, {
                                utm_content: e.target.value.trim() || undefined,
                              })
                            }
                            className="w-full min-w-[80px] rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeLeaf(group.id, leaf.id)}
                            className="text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {group.children.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">
                    소분류가 없습니다. 위에서「소분류 추가」를 눌러 주세요.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
