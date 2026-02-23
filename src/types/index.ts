// User & Profile Types

export type UserRole = 'superadmin' | 'r5' | 'r4' | 'member';

export interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface Profile {
  id: string;
  display_name: string;
  hq_level: number;
  power: number;
  notes: string | null;
  role: UserRole;
  alliance_id: string | null;
  can_edit_alliance: boolean;
  is_president: boolean;
  created_at: string;
  updated_at: string;
}

// Alliance Types

export type RecruitmentStatus = 'open' | 'closed' | 'invite_only';

export interface Alliance {
  id: string;
  name: string;
  rank: number; // 1, 2, or 3 (Top 3 only)
  description: string;
  recruitment_status: RecruitmentStatus;
  contact_info: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Application Types

export type ApplicationStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';

export type ApprovalStageStatus = 'pending' | 'approved' | 'rejected';

export interface MigrationApplication {
  id: string;
  player_name: string;
  current_server: string;
  current_alliance?: string | null;
  power_level: number;
  hq_level: number;
  troop_level?: string | null;
  arena_power?: string | null;
  duel_points?: string | null;
  svs_participation?: string | null;
  target_alliance_id: string;
  motivation: string;
  screenshots?: string[] | null;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  reviewed_by: string | null;
  alliance_status: ApprovalStageStatus;
  alliance_reviewed_by: string | null;
  alliance_reviewed_at: string | null;
  alliance_note: string | null;
  president_status: ApprovalStageStatus;
  president_reviewed_by: string | null;
  president_reviewed_at: string | null;
  president_note: string | null;
}

// Chat Types

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  room_name: string;
  created_at: string;
  updated_at?: string;
}

// AI Types

export type AIImageType = 'banner' | 'emblem' | 'logo_draft';

export interface AIGeneratedImage {
  id: string;
  user_id: string;
  alliance_id: string | null;
  image_url: string;
  prompt: string;
  image_type: AIImageType;
  created_at: string;
}

export type PresentationTone = 'formal' | 'casual' | 'enthusiastic' | 'professional';

export interface AlliancePresentation {
  id: string;
  alliance_id: string;
  generated_by: string;
  bullet_points: string[];
  tone: PresentationTone;
  content: string;
  is_published: boolean;
  created_at: string;
  reviewed_at: string | null;
}

// Rate Limit Types

export type ResourceType = 'application_submit' | 'ai_image_generate';

export interface RateLimit {
  id: number;
  user_id: string | null;
  ip_address: string | null;
  resource_type: ResourceType;
  request_count: number;
  window_start: string;
}

// State Info Types

export interface StateInfo {
  id: string;
  section_key: string;
  title: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface StateInfoProposal {
  id: string;
  section_key: string;
  proposed_title: string;
  proposed_content: string;
  proposed_by: string | null;
  status: ProposalStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface StateInfoVote {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote: 'approve' | 'reject';
  voted_at: string;
}

// Combined Types for API Responses

export interface UserWithProfile extends User {
  profile: Profile | null;
}

export interface AllianceWithApplications extends Alliance {
  applications?: MigrationApplication[];
}

export interface ApprovedPlayer {
  id: string;
  player_name: string;
  target_alliance_name: string;
  power_level: number;
  approved_at: string;
  troop_level?: string | null;
}
