import type { Profile } from '@/types';

interface ProfileDisplayProps {
  profile: Profile;
}

export function ProfileDisplay({ profile }: ProfileDisplayProps) {
  const roleLabels: Record<string, string> = {
    member: 'Member',
    r4: 'Officer (R4)',
    r5: 'Leader (R5)',
  };

  return (
    <div className="surface rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Your Profile
      </h2>

      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <p className="text-sm text-slate-500 mb-1">Display Name</p>
          <p className="text-slate-900 font-medium">{profile.display_name}</p>
        </div>

        {/* Role */}
        <div>
          <p className="text-sm text-slate-500 mb-1">Role</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            profile.role === 'r5'
              ? 'bg-amber-100 text-amber-800'
              : profile.role === 'r4'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-100 text-slate-800'
          }`}>
            {roleLabels[profile.role] || profile.role}
          </span>
        </div>

        {/* HQ Level */}
        <div>
          <p className="text-sm text-slate-500 mb-1">HQ Level</p>
          <p className="text-slate-900 font-medium">{profile.hq_level}</p>
        </div>

        {/* Power Level */}
        <div>
          <p className="text-sm text-slate-500 mb-1">Power Level</p>
          <p className="text-slate-900 font-medium">{profile.power.toLocaleString()}</p>
        </div>

        {/* Alliance */}
        {profile.alliance_id ? (
          <div>
            <p className="text-sm text-slate-500 mb-1">Alliance</p>
            <p className="text-blue-600 font-medium">Member of an alliance</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-1">Alliance</p>
            <p className="text-slate-500">Not a member of any alliance</p>
          </div>
        )}

        {/* Notes */}
        {profile.notes && (
          <div>
            <p className="text-sm text-slate-500 mb-1">Notes</p>
            <p className="text-slate-700">{profile.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
