import React from 'react';
import { AdminGalleryPhoto, AdminHelpSummary, AdminSnapshot } from '../types';
import { soundService } from '../services/soundService';

interface AdminPanelProps {
  mode: 'wall' | 'stats' | 'users' | 'help';
  snapshot: AdminSnapshot | null;
  gallery?: AdminGalleryPhoto[];
  help?: AdminHelpSummary | null;
  loading: boolean;
  error?: string | null;
  helpError?: string | null;
  onRefresh: () => void | Promise<void>;
  onDeleteUser: (userId: number) => void | Promise<void>;
  onToggleAdmin: (userId: number, nextValue: boolean) => void | Promise<void>;
  currentUserId?: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  mode,
  snapshot,
  gallery,
  help,
  loading,
  error,
  helpError,
  onRefresh,
  onDeleteUser,
  onToggleAdmin,
  currentUserId
}) => {
  const stats = snapshot?.stats;
  const users = snapshot?.users ?? [];
  const recent = snapshot?.recent ?? [];
  const wallItems = gallery ?? [];
  const helpContent = help ?? snapshot?.help ?? null;
  const activeError = mode === 'help' ? helpError ?? error : error;
  const helpSections = helpContent
    ? [
        { title: 'Technologies', items: helpContent.technologies },
        { title: 'Frontend Libraries', items: helpContent.frontendLibraries },
        { title: 'Backend Stack', items: helpContent.backendStack },
        { title: 'Tooling', items: helpContent.tooling },
        { title: 'Fonts', items: helpContent.fonts },
        { title: 'Highlights', items: helpContent.highlights },
        { title: 'Roadmap', items: helpContent.roadmap }
      ]
    : [];

  const formatDate = (value: number | null) => {
    if (!value) return '—';
    return new Date(value * 1000).toLocaleString();
  };

  const formatDuration = (value: number | null) => {
    if (!value) return 'Never';
    const delta = Date.now() - value * 1000;
    const mins = Math.floor(delta / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefresh = () => {
    soundService.play('pop');
    void onRefresh();
  };

  const handleToggle = (userId: number, isAdmin: boolean) => {
    if (userId === currentUserId) return;
    soundService.play('click');
    void onToggleAdmin(userId, !isAdmin);
  };

  const handleDelete = (userId: number, username: string) => {
    if (userId === currentUserId) return;
    soundService.play('ghost');
    const ok = window.confirm(`Delete ${username}'s account and strips?`);
    if (!ok) return;
    void onDeleteUser(userId);
  };

  const subtitle = {
    wall: 'Celebrate every spooky strip ever saved',
    stats: 'See raw booth metrics without the fluff',
    users: 'Promote, demote, or purge members with care',
    help: 'Present the story, stack, and future roadmap'
  }[mode];

  return (
    <div className="font-admin flex flex-col gap-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-admin-heading text-orange-400 tracking-[0.12em]">
            {mode === 'wall'
              ? 'Wall of Fame'
              : mode === 'stats'
                ? 'Live Stats'
                : mode === 'users'
                  ? 'User Management'
                  : 'Help Brief'}
          </h2>
          <p className="text-xs text-purple-200/40 uppercase tracking-[0.45em]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 transition-all text-white text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {activeError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-2xl">
          {activeError}
        </div>
      )}

      {mode === 'wall' && (
        <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          {loading && !wallItems.length ? (
            <p className="text-sm text-white/50">Loading the wall...</p>
          ) : wallItems.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {wallItems.map((item) => (
                <article key={item.id} className="group relative rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                  <div className="relative w-full aspect-[3/7] min-h-[220px] rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.username}
                      className="h-full w-full max-h-[320px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white text-[11px] uppercase tracking-[0.35em]">
                      <span className="font-semibold">{item.username}</span>
                      <span className="text-white/60">{formatDuration(item.timestamp)}</span>
                      <span className="text-white/40">#{item.id}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">No photos captured yet.</p>
          )}
        </section>
      )}

      {mode === 'stats' && (
        stats ? (
          <>
            <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm overflow-x-auto">
              <table className="min-w-[320px] w-full text-left text-sm text-white/80">
                <caption className="text-left text-xs uppercase tracking-[0.4em] text-white/30 mb-4">Snapshot Overview</caption>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <th className="py-3 pr-6 text-white/50 font-semibold uppercase tracking-[0.35em] text-[11px]">Total Users</th>
                    <td className="py-3 text-white/80">{stats.totalUsers}</td>
                  </tr>
                  <tr>
                    <th className="py-3 pr-6 text-white/50 font-semibold uppercase tracking-[0.35em] text-[11px]">Total Photos</th>
                    <td className="py-3 text-white/80">{stats.totalPhotos}</td>
                  </tr>
                  <tr>
                    <th className="py-3 pr-6 text-white/50 font-semibold uppercase tracking-[0.35em] text-[11px]">Photos Last 24h</th>
                    <td className="py-3 text-white/80">{stats.photosLast24h}</td>
                  </tr>
                  <tr>
                    <th className="py-3 pr-6 text-white/50 font-semibold uppercase tracking-[0.35em] text-[11px]">Active Users Last 24h</th>
                    <td className="py-3 text-white/80">{stats.activeUsersLast24h}</td>
                  </tr>
                  <tr>
                    <th className="py-3 pr-6 text-white/50 font-semibold uppercase tracking-[0.35em] text-[11px]">New Users Last 7d</th>
                    <td className="py-3 text-white/80">{stats.newUsersLast7d}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm overflow-x-auto">
                <header className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-admin-heading text-orange-300 tracking-[0.15em]">Top Creators</h3>
                  <span className="text-[10px] uppercase text-white/30 tracking-[0.4em]">Lifetime</span>
                </header>
                {stats.topCreators.length ? (
                  <table className="min-w-[280px] w-full text-left text-sm text-white/80">
                    <thead className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      <tr>
                        <th className="py-2 pr-4">Rank</th>
                        <th className="py-2 pr-4">Creator</th>
                        <th className="py-2 pr-4 text-right">Strips</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stats.topCreators.map((creator, index) => (
                        <tr key={creator.userId}>
                          <td className="py-3 pr-4 text-xs text-white/50">#{index + 1}</td>
                          <td className="py-3 pr-4 font-semibold">{creator.username}</td>
                          <td className="py-3 pr-4 text-right text-xs">{creator.photoCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-white/40">No creators have saved strips yet.</p>
                )}
              </section>

              <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm overflow-x-auto">
                <header className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-admin-heading text-orange-300 tracking-[0.15em]">Recent Uploads</h3>
                  <span className="text-[10px] uppercase text-white/30 tracking-[0.4em]">Latest 12</span>
                </header>
                {recent.length ? (
                  <table className="min-w-[320px] w-full text-left text-sm text-white/80">
                    <thead className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                      <tr>
                        <th className="py-2 pr-4">Time</th>
                        <th className="py-2 pr-4">User</th>
                        <th className="py-2 pr-4">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recent.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 pr-4 text-xs text-white/50">{formatDuration(item.timestamp)}</td>
                          <td className="py-3 pr-4 font-semibold">{item.username}</td>
                          <td className="py-3 pr-4 text-xs text-white/60">
                            <a href={item.url} className="underline decoration-dotted" target="_blank" rel="noopener noreferrer">
                              View Strip
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-white/40">No uploads recorded yet.</p>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-white/60 text-sm text-center">
            {loading ? 'Loading admin snapshot...' : 'No admin data yet.'}
          </div>
        )
      )}

      {mode === 'users' && (
        <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-admin-heading text-orange-300 tracking-[0.15em]">User Management</h3>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">{users.length} accounts</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/20">Promote or remove with care</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                <tr>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Last Strip</th>
                  <th className="py-2 pr-4 text-center">Strips</th>
                  <th className="py-2 pr-4 text-center">Role</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.username}</span>
                          {user.id === currentUserId && <span className="text-[10px] uppercase text-orange-300 tracking-[0.3em]">You</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-white/50">{formatDate(user.createdAt)}</td>
                      <td className="py-3 pr-4 text-xs text-white/50">{formatDuration(user.lastPhotoAt)}</td>
                      <td className="py-3 pr-4 text-center text-xs">{user.photoCount}</td>
                      <td className="py-3 pr-4 text-center text-xs">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.isAdmin ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                          {user.isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(user.id, user.isAdmin)}
                            disabled={user.id === currentUserId || loading}
                            className="px-3 py-1 rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-400/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {user.isAdmin ? 'Revoke Admin' : 'Promote'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            disabled={user.id === currentUserId || loading}
                            className="px-3 py-1 rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-white/30">
                      {loading ? 'Loading users...' : 'No registered users yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mode === 'help' && (
        <section className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col gap-8">
          {loading ? (
            <p className="text-sm text-white/50">Loading help brief...</p>
          ) : helpContent ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-admin-heading text-orange-300 tracking-[0.15em]">{helpContent.projectName || 'Project Overview'}</h3>
                  {helpContent.pitch && (
                    <p className="mt-2 max-w-2xl text-sm text-white/70 leading-relaxed">{helpContent.pitch}</p>
                  )}
                </div>
                <button
                  onClick={handleRefresh}
                  className="self-start lg:self-center px-4 py-2 rounded-full border border-white/15 text-[10px] uppercase tracking-[0.35em] text-white/60 hover:text-white hover:border-white/40 transition-all"
                >
                  Refresh Help
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {helpSections.map(({ title, items }) => (
                  <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h4 className="text-sm font-admin-heading text-orange-200 tracking-[0.12em] mb-3">{title}</h4>
                    {items.length ? (
                      <ul className="space-y-2 text-[13px] text-white/70">
                        {items.map((item, index) => (
                          <li key={`${title}-${index}`} className="flex items-start gap-2">
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-white/30">No details provided.</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-white/40">No help content configured yet.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminPanel;
