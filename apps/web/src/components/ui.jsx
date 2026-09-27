import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Button({ children, variant = 'primary', busy = false, className = '', disabled, ...props }) {
  return <button type="button" className={`button button-${variant} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>{busy && <Loader2 className="spin" size={16} aria-hidden="true" />}{children}</button>;
}
export function ButtonLink({ children, variant = 'primary', className = '', ...props }) {
  return <Link className={`button button-${variant} ${className}`} {...props}>{children}</Link>;
}
export function Card({ children, className = '', ...props }) { return <section className={`card ${className}`} {...props}>{children}</section>; }
export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}
export function SectionHeader({ title, description, action }) { return <div className="section-heading"><div><h2>{title}</h2>{description && <p className="muted text-sm">{description}</p>}</div>{action}</div>; }
export function Badge({ children, tone }) {
  const value = String(children);
  const semantic = tone || ({ Easy: 'success', Medium: 'warning', Hard: 'danger', completed: 'success', in_progress: 'info', created: 'neutral', abandoned: 'neutral' }[value]) || 'neutral';
  return <span className={`badge badge-${semantic}`}>{({ completed: 'Completed', in_progress: 'In progress', created: 'Ready to start', abandoned: 'Abandoned' }[value]) || children}</span>;
}
export function Chips({ items = [], tone = 'neutral' }) { return items.length ? <div className="chips">{items.map((item, i) => <Badge key={i} tone={tone}>{item}</Badge>)}</div> : <p className="muted text-sm">None listed.</p>; }
export function FeedbackList({ title, items = [], tone = '', ordered = false }) {
  const List = ordered ? 'ol' : 'ul';
  return <section className={`feedback-block ${tone}`}><h3>{title}</h3>{items.length ? <List className={ordered ? 'number-list' : 'bullet-list'}>{items.map((item, i) => <li key={i}>{item}</li>)}</List> : <p className="muted">None noted.</p>}</section>;
}
export function ErrorState({ message, retry }) { return <div className="notice notice-error" role="alert"><AlertCircle size={19} aria-hidden="true" /><div><strong>Something needs your attention</strong><p>{message}</p>{retry && <Button variant="outline" onClick={retry}>Try again</Button>}</div></div>; }
export function SuccessState({ children }) { return <div className="notice notice-success" role="status"><CheckCircle2 size={18} aria-hidden="true" /><span>{children}</span></div>; }
export function LoadingState({ label = 'Loading your workspace…' }) { return <div className="loading-state" role="status" aria-live="polite"><Loader2 className="spin" size={22} aria-hidden="true" /><p>{label}</p><div className="skeleton" /><div className="skeleton short" /></div>; }
export function EmptyState({ title, description, action }) { return <div className="empty-state"><div className="icon-tile"><Sparkles size={22} aria-hidden="true" /></div><h3>{title}</h3><p className="muted">{description}</p>{action}</div>; }
export function StatCard({ icon: Icon, label, value, detail }) { return <Card className="stat-card"><div className="stat-label"><span>{label}</span><Icon size={18} aria-hidden="true" /></div><strong className="stat-value">{value}</strong><p className="muted text-xs">{detail}</p></Card>; }
export function Evaluation({ evaluation }) {
  if (!evaluation) return null;
  return <div className="evaluation stack"><div className="section-heading"><h2>Answer feedback</h2><div className="score-inline">{evaluation.score ?? '—'} <span>/ 10</span></div></div><div className="metric-grid">{[['technicalAccuracy','Technical accuracy'],['completeness','Completeness'],['communication','Communication'],['problemSolving','Problem solving'],['depth','Depth']].map(([key,label]) => <div className="metric" key={key}><span>{label}</span><strong>{evaluation[key] ?? '—'}<small> / 10</small></strong></div>)}</div><div className="grid-two"><FeedbackList title="Strengths" items={evaluation.strengths} tone="positive" /><FeedbackList title="Gaps" items={evaluation.gaps} tone="attention" /><FeedbackList title="Missing concepts" items={evaluation.missingConcepts} /><FeedbackList title="Improvement tips" items={evaluation.improvementTips} /></div><section className="model-answer"><h3>Model answer</h3><p className="prose-text">{evaluation.modelAnswer || 'No model answer provided.'}</p></section></div>;
}
export function SessionList({ sessions, compact = false }) {
  return <div className="session-table"><table><caption className="sr-only">Interview sessions</caption><thead><tr><th>Role / mode</th>{!compact && <th>Type</th>}<th>Difficulty</th>{!compact && <th>Questions</th>}<th>Score</th><th>Status</th><th>Date</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{sessions.map(s => <tr key={s._id}><td data-label="Role"><strong>{s.targetRole}</strong><span className="table-meta">{s.interviewMode}</span></td>{!compact && <td data-label="Type">{s.interviewType}</td>}<td data-label="Difficulty"><Badge>{s.difficulty}</Badge></td>{!compact && <td data-label="Questions">{s.questionCount ?? s.questions?.length ?? '—'}</td>}<td data-label="Score"><strong>{s.overallScore != null ? `${s.overallScore}/10` : '—'}</strong></td><td data-label="Status"><Badge>{s.status}</Badge></td><td data-label="Date">{new Date(s.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</td><td><Link className="text-link" to={s.status === 'completed' ? `/interview/${s._id}/results` : `/interview/${s._id}`}>{s.status === 'completed' ? 'View results' : 'Continue'}<ArrowRight size={14} aria-hidden="true" /></Link></td></tr>)}</tbody></table></div>;
}
