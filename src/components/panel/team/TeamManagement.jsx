import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Trash2, UserCog, CheckCircle, Loader2, AlertCircle, X, Save } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function TeamManagement() {
  const { tenantId, tenant, membership, getLimit, hasFeature } = useTenant();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const supabase = getSupabase();

  const maxMembers = getLimit('max_members');
  const canManageTeam = hasFeature('team_management');
  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'admin' || isOwner;

  useEffect(() => {
    loadMembers();
  }, [tenantId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      if (!supabase || !tenantId) return;

      const { data, error: mErr } = await supabase
        .from('tenant_members')
        .select('id, role, is_active, created_at, user_id, profiles:user_id(full_name, email, avatar_url)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (mErr) throw mErr;
      setMembers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setError('E-posta adresi gerekli'); return; }

    const activeCount = members.filter(m => m.is_active).length;
    if (maxMembers > 0 && activeCount >= maxMembers) {
      setError(`Planınız en fazla ${maxMembers} üyeye izin veriyor. Lütfen planınızı yükseltin.`);
      return;
    }

    try {
      setInviting(true);
      setError('');

      // Check if user exists in profiles
      const { data: profileData, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (pErr || !profileData) {
        setError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Kullanıcının önce sisteme kayıt olması gerekiyor.');
        return;
      }

      // Check if already a member
      const existing = members.find(m => m.user_id === profileData.id);
      if (existing) {
        if (existing.is_active) {
          setError('Bu kullanıcı zaten ekip üyesi.');
          return;
        }
        // Reactivate
        const { error: uErr } = await supabase
          .from('tenant_members')
          .update({ is_active: true, role: inviteRole })
          .eq('id', existing.id);
        if (uErr) throw uErr;
      } else {
        // Add new member
        const { error: iErr } = await supabase
          .from('tenant_members')
          .insert({
            tenant_id: tenantId,
            user_id: profileData.id,
            role: inviteRole,
            is_active: true,
          });
        if (iErr) throw iErr;
      }

      setSuccess(`${profileData.full_name || inviteEmail} ekibe eklendi`);
      setInviteEmail('');
      setShowInvite(false);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      setError('');
      const { error: uErr } = await supabase
        .from('tenant_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('tenant_id', tenantId);
      if (uErr) throw uErr;
      setSuccess('Rol güncellendi');
      setEditingMember(null);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.role === 'owner') { setError('Firma sahibi çıkarılamaz'); return; }
    if (member.user_id === user?.id) { setError('Kendinizi çıkaramazsınız'); return; }

    try {
      setError('');
      const { error: uErr } = await supabase
        .from('tenant_members')
        .update({ is_active: false })
        .eq('id', member.id)
        .eq('tenant_id', tenantId);
      if (uErr) throw uErr;
      setSuccess(`${member.profiles?.full_name || 'Üye'} ekipten çıkarıldı`);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  const getRoleBadge = (role) => {
    const map = {
      owner: { label: 'Sahip', cls: 'bg-purple-100 text-purple-700' },
      admin: { label: 'Yönetici', cls: 'bg-amber-100 text-amber-700' },
      member: { label: 'Üye', cls: 'bg-blue-100 text-blue-700' },
    };
    const badge = map[role] || { label: role, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!canManageTeam) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ekip Yönetimi</h2>
        <p className="text-gray-500 mb-4">Bu özellik mevcut planınızda bulunmuyor.</p>
        <a href="/panel/subscription" className="text-amber-600 hover:text-amber-700 font-medium">
          Planınızı yükseltin →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ekip Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            {activeMembers.length} aktif üye
            {maxMembers > 0 && ` / ${maxMembers} üye hakkı`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-5 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Üye Ekle
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-green-700 text-sm">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-amber-300 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Yeni Üye Ekle</h3>
            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">E-posta Adresi</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="ornek@firma.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="member">Üye</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-5 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Ekle
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Kullanıcının sisteme kayıtlı olması gerekir.</p>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Üye</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Katılma Tarihi</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Durum</th>
                {isAdmin && <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                        {(m.profiles?.full_name || m.profiles?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{m.profiles?.full_name || 'İsimsiz'}</p>
                        <p className="text-xs text-gray-500">{m.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {editingMember === m.id ? (
                      <select
                        defaultValue={m.role}
                        onChange={(e) => handleChangeRole(m.id, e.target.value)}
                        onBlur={() => setEditingMember(null)}
                        autoFocus
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="member">Üye</option>
                        <option value="admin">Yönetici</option>
                      </select>
                    ) : (
                      getRoleBadge(m.role)
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(m.created_at)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-center">
                      {m.role !== 'owner' && m.user_id !== user?.id && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingMember(m.id)}
                            className="text-amber-600 hover:text-amber-700 transition"
                            title="Rol değiştir"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m)}
                            className="text-red-500 hover:text-red-600 transition"
                            title="Çıkar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Pasif Üyeler ({inactiveMembers.length})</h3>
          <div className="space-y-2">
            {inactiveMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm text-gray-400">
                <span>{m.profiles?.full_name || m.profiles?.email || 'İsimsiz'}</span>
                <span className="text-xs">Çıkarıldı</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
