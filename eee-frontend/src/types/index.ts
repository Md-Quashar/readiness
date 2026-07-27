export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'applicant';
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Scope {
  id: number;
  scope: string;
}

export interface Section {
  id: number;
  sectionName: string;
}

export interface Question {
  id: number;
  question: string;
  explanation: string;
  question_section: string;
  feedback_for_yes: string;
  feedback_for_no: string;
  guidance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: number;
  user: string;
  question: number;
  answer: 'yes' | 'no';
  lab_type: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAnswer {
  question: number;
  answer: 'yes' | 'no';
  lab_type: string;
  scope: string;
}


// ─── Theme ────────────────────────────────────────────────────────────────────
export interface ThemeTokens {
  bg: string; navBg: string; navBorder: string; heroBg: string;
  heroCardBorder: string; text: string; textSub: string; textMuted: string;
  accent: string; accentHover: string; featureCard: string;
  featureCardBorder: string; featureIconBg: string; featureIconColor: string;
  stepCard: string; stepCardBorder: string; stepNum: string; stepText: string;
  reqCard: string; reqCardBorder: string; ctaBg: string; ctaBorder: string;
  btnPrimary: string; btnPrimaryHover: string; btnText: string;
  footerBg: string; footerBorder: string; footerText: string; divider: string;
  badgeBg: string; badgeText: string; badgeBorder: string;
  toggleBg: string; toggleBorder: string; orb1: string; orb2: string;
  sectionAltBg: string; warningBg: string; warningBorder: string; warningTitle: string;
}

// ─── Homepage content ─────────────────────────────────────────────────────────
export interface RequirementNode { label: string; color: string; desc: string; iconKey: string; }
export interface FeatureItem { iconKey: string; title: string; desc: string; }
export interface StepItem { num: string; title: string; desc: string; }


// ─── Monitoring ───────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: number;
  user?: number;
  user_email: string;
  user_name: string;
  activity_type:
    | 'login_success'
    | 'login_failed'
    | 'submission_single'
    | 'submission_bulk'
    | 'password_reset'
    | 'question_created'
    | 'question_updated'
    | 'question_deleted'
    | 'question_toggled';
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  created_at: string;
}

