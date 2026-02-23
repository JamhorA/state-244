'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

export default function HelpPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isOfficer, isSuperadmin, isR5, isPresident, profile } = useRole();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      roles: ['all'],
      content: `
        <p>Welcome to State 244 Hub - your central platform for alliance management and migration applications.</p>
        <h4>What you can do:</h4>
        <ul>
          <li><strong>Manage your profile</strong> - Update your display name, HQ level, and power</li>
          <li><strong>View alliance info</strong> - See your alliance details and members</li>
          <li><strong>Review applications</strong> - Process migration requests (officers)</li>
          <li><strong>Vote on proposals</strong> - Participate in state decisions (R5+)</li>
        </ul>
      `
    },
    {
      id: 'roles',
      title: 'Understanding Roles',
      icon: '👤',
      roles: ['all'],
      content: `
        <div class="space-y-3">
          <div class="p-3 bg-slate-500/10 rounded-lg border border-slate-500/20">
            <strong class="text-slate-300">Member</strong>
            <p class="text-sm text-slate-400 mt-1">Basic access - view profile and alliance info</p>
          </div>
          <div class="p-3 bg-sky-500/10 rounded-lg border border-sky-500/20">
            <strong class="text-sky-300">R4 (Officer)</strong>
            <p class="text-sm text-slate-400 mt-1">Can review migration applications and manage alliance</p>
          </div>
          <div class="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <strong class="text-amber-300">R5 (Leader)</strong>
            <p class="text-sm text-slate-400 mt-1">Full alliance control + vote on state proposals</p>
          </div>
          <div class="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <strong class="text-purple-300">President</strong>
            <p class="text-sm text-slate-400 mt-1">Final approval on all migration applications</p>
          </div>
          <div class="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <strong class="text-red-300">Superadmin</strong>
            <p class="text-sm text-slate-400 mt-1">Full system access - manage all users and settings</p>
          </div>
        </div>
      `
    },
    {
      id: 'profile',
      title: 'Profile Management',
      icon: '⚙️',
      roles: ['all'],
      content: `
        <h4>How to edit your profile:</h4>
        <ol>
          <li>Go to <strong>Dashboard</strong></li>
          <li>Click on <strong>"Edit Profile"</strong> button</li>
          <li>Update your display name, HQ level, and power</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>
        <p class="text-slate-400 text-sm mt-2">💡 Your HQ level should be between 1-35 and power should be your actual in-game power.</p>
      `
    },
    {
      id: 'alliance',
      title: 'Alliance Management',
      icon: '🏛️',
      roles: ['r4', 'r5', 'superadmin'],
      content: `
        <h4>Accessing Alliance Settings:</h4>
        <ol>
          <li>Navigate to <strong>Alliance</strong> from the menu</li>
          <li>View your alliance info, members, and settings</li>
        </ol>
        <h4>What you can do:</h4>
        <ul>
          <li>View all alliance members and their roles</li>
          <li>Update alliance description and settings</li>
          <li>Manage member permissions</li>
        </ul>
      `
    },
    {
      id: 'applications',
      title: 'Migration Applications',
      icon: '📋',
      roles: ['r4', 'r5', 'president', 'superadmin'],
      content: `
        <h4>Application Workflow:</h4>
        <ol>
          <li><strong>Submitted</strong> - Player applies to join an alliance</li>
          <li><strong>Alliance Review</strong> - R4/R5 approve or reject</li>
          <li><strong>President Review</strong> - President gives final approval</li>
          <li><strong>Approved/Rejected</strong> - Final status</li>
        </ol>
        <h4>How to review applications:</h4>
        <ol>
          <li>Go to <strong>Applications</strong> page</li>
          <li>Use <strong>filters</strong> to find specific applications (status, alliance)</li>
          <li>Use <strong>search</strong> to find by player name or server</li>
          <li>Click on a card to view full details</li>
          <li>Click <strong>Approve</strong> or <strong>Reject</strong></li>
          <li>Optionally add a note explaining your decision</li>
        </ol>
        <h4>Export to Excel:</h4>
        <p>Click the <strong>"Export Excel"</strong> button to download all filtered applications as a spreadsheet.</p>
      `
    },
    {
      id: 'proposals',
      title: 'State Info Proposals',
      icon: '📝',
      roles: ['r5', 'superadmin'],
      content: `
        <h4>What are proposals?</h4>
        <p>Proposals are changes to state information that require voting by R5 leaders and superadmins.</p>
        <h4>How it works:</h4>
        <ol>
          <li>Any R5 or superadmin can create a proposal</li>
          <li>Other R5/superadmins vote <strong>Approve</strong> or <strong>Reject</strong></li>
          <li>Proposal passes when it reaches required votes</li>
        </ol>
        <h4>Voting:</h4>
        <ol>
          <li>Go to <strong>Proposals</strong> page</li>
          <li>Review pending proposals</li>
          <li>Click <strong>Approve</strong> or <strong>Reject</strong></li>
        </ol>
      `
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      icon: '🔧',
      roles: ['superadmin'],
      content: `
        <h4>Superadmin Capabilities:</h4>
        <ul>
          <li><strong>User Management</strong> - View all users, create accounts, manage roles</li>
          <li><strong>Assign President</strong> - Set who has president role</li>
          <li><strong>State Info</strong> - Manage state-level information</li>
          <li><strong>Full Access</strong> - Can approve/reject any application</li>
        </ul>
        <h4>Accessing Admin Panel:</h4>
        <ol>
          <li>Click <strong>Admin</strong> in the navigation menu</li>
          <li>Use the tabs to access different admin features</li>
        </ol>
      `
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: '❓',
      roles: ['all'],
      content: `
        <div class="space-y-4">
          <div>
            <strong class="text-white">Q: How do I change my password?</strong>
            <p class="text-slate-400 text-sm mt-1">A: Go to Dashboard → Change Password</p>
          </div>
          <div>
            <strong class="text-white">Q: Why can't I see the Applications page?</strong>
            <p class="text-slate-400 text-sm mt-1">A: Only R4, R5, President, and Superadmin can access applications.</p>
          </div>
          <div>
            <strong class="text-white">Q: How do I apply to migrate?</strong>
            <p class="text-slate-400 text-sm mt-1">A: Visit the public Apply page (no login required) and fill out the application form.</p>
          </div>
          <div>
            <strong class="text-white">Q: Can I see applications from other alliances?</strong>
            <p class="text-slate-400 text-sm mt-1">A: Yes, R4/R5 can view all applications but can only approve/reject their own alliance's.</p>
          </div>
          <div>
            <strong class="text-white">Q: What happens after I approve an application?</strong>
            <p class="text-slate-400 text-sm mt-1">A: Approved applications move to President review. President gives final approval.</p>
          </div>
        </div>
      `
    }
  ];

  const filteredSections = sections.filter(section => {
    if (section.roles.includes('all')) return true;
    if (section.roles.includes('superadmin') && isSuperadmin()) return true;
    if (section.roles.includes('r5') && isR5()) return true;
    if (section.roles.includes('r4') && isOfficer()) return true;
    if (section.roles.includes('president') && isPresident()) return true;
    return false;
  });

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Guide</h1>
        <p className="text-slate-400">
          Learn how to use State 244 Hub effectively
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {filteredSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-sm"
              >
                <span className="text-lg">{section.icon}</span>
                <span>{section.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {filteredSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="glass-card rounded-xl border border-slate-800/80 p-6 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <div 
                className="prose prose-invert prose-sm max-w-none text-slate-300 [&>h4]:text-white [&>h4]:font-semibold [&>h4]:mt-4 [&>h4]:mb-2 [&>p]:text-slate-400 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </section>
          ))}

          {/* Contact Section */}
          <section className="glass-card rounded-xl border border-slate-800/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💬</span>
              <h2 className="text-xl font-bold text-white">Need More Help?</h2>
            </div>
            <p className="text-slate-400">
              If you have questions not covered in this guide, contact your alliance leadership or a superadmin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
