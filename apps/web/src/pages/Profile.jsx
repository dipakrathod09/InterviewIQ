import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Upload, ArrowRight, CheckCircle2, UserRound } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Card, PageHeader, SectionHeader, Button, ButtonLink, Badge, Chips, FeedbackList, LoadingState, ErrorState, SuccessState, EmptyState } from '../components/ui';
import * as profileService from '../services/profileService';

// Resume upload states
const UPLOAD_STATES = {
  IDLE: 'idle',
  FILE_SELECTED: 'file_selected',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const MAX_PDF_MB = 5;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

export default function Profile() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const tab = ['resume','job-description','match','account'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'resume';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // PDF upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Text resume / JD / analysis
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [isSubmittingJd, setIsSubmittingJd] = useState(false);
  const [isGeneratingMatch, setIsGeneratingMatch] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── PDF Upload handlers ─────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation (UX only — backend enforces independently)
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.');
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setUploadError(`File is too large. Maximum size is ${MAX_PDF_MB} MB.`);
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    setUploadState(UPLOAD_STATES.FILE_SELECTED);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploadState === UPLOAD_STATES.UPLOADING) return;
    setUploadState(UPLOAD_STATES.UPLOADING);
    setUploadError('');
    setError('');
    setSuccess('');
    try {
      await profileService.uploadResumePdf(selectedFile);
      setUploadState(UPLOAD_STATES.SUCCESS);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadProfile();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadState(UPLOAD_STATES.ERROR);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadError('');
    setUploadState(UPLOAD_STATES.IDLE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Text resume / JD handlers ───────────────────────────────────────────────

  const handleResumeAnalyze = async (e) => {
    e.preventDefault();
    // Use uploaded rawText if no new text pasted
    const text = resumeText.trim() || profile?.resume?.rawText;
    if (!text) return;
    setIsAnalyzingResume(true);
    setError(''); setSuccess('');
    try {
      await profileService.submitResume(text);
      setSuccess('Resume analyzed successfully!');
      setResumeText('');
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleJdSubmit = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    setIsSubmittingJd(true);
    setError(''); setSuccess('');
    try {
      await profileService.submitJobDescription(jdText);
      setSuccess('Job description analyzed successfully!');
      setJdText('');
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze JD');
    } finally {
      setIsSubmittingJd(false);
    }
  };

  const handleGenerateMatch = async () => {
    setIsGeneratingMatch(true);
    setError(''); setSuccess('');
    try {
      await profileService.getMatchAnalysis();
      setSuccess('Match analysis generated!');
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate match analysis');
    } finally {
      setIsGeneratingMatch(false);
    }
  };


  if (loading) return <LoadingState label="Loading your candidate profile…" />;
  const canMatch = profile?.resume?.analyzedAt && profile?.jobDescription?.analyzedAt;
  const hasUploadedResume = !!profile?.resume?.rawText;
  const resume = profile?.resume, jd = profile?.jobDescription, match = profile?.matchAnalysis;
  const formatBytes = bytes => bytes > 1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : `${Math.round(bytes/1024)} KB`;
  return <div className="narrow"><PageHeader eyebrow="YOUR EXPERIENCE. YOUR NEXT OPPORTUNITY." title={tab==='account'?'Your profile':'Resume & job description'} description="Bring your background and target role together for more relevant practice."/>
    <nav className="profile-tabs" aria-label="Profile sections">{[['resume','Resume'],['job-description','Job description'],['match','Match analysis'],['account','Profile']].map(([key,label])=><Link key={key} to={`/profile#${key}`} className={tab===key?'active':''} aria-current={tab===key?'page':undefined}>{label}</Link>)}</nav>
    {error&&<ErrorState message={error} retry={loadProfile}/>} {success&&<SuccessState>{success}</SuccessState>}
    {tab==='account'&&<Card><SectionHeader title="Personal workspace" description="Your account information" action={<UserRound size={22} color="var(--primary)"/>}/><dl className="form-grid"><div><dt className="muted text-xs mb-2">Full name</dt><dd className="font-semibold">{user?.name}</dd></div><div><dt className="muted text-xs mb-2">Email address</dt><dd className="font-semibold break-all">{user?.email}</dd></div></dl><div className="mt-6"><ButtonLink variant="outline" to="/profile#resume">Manage resume & job description<ArrowRight size={15}/></ButtonLink></div></Card>}
    {tab==='resume'&&<div className="stack"><Card><SectionHeader title="Your resume" description="Upload a PDF to give your preparation a starting point."/><div className="upload-area"><span className="icon-tile"><Upload size={23}/></span><div><h3>Choose your resume</h3><p className="muted text-xs mt-1">PDF only · Up to 5 MB · Text-based documents</p></div><label htmlFor="resume-file-input" className="sr-only">Choose PDF resume</label><input id="resume-file-input" ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileSelect} disabled={uploadState===UPLOAD_STATES.UPLOADING}/>{selectedFile&&<p className="text-sm">{selectedFile.name} <span className="muted">· {formatBytes(selectedFile.size)}</span></p>}<div className="flex flex-wrap justify-center gap-2"><Button onClick={handleUpload} disabled={!selectedFile} busy={uploadState===UPLOAD_STATES.UPLOADING}>{uploadState===UPLOAD_STATES.UPLOADING?'Uploading…':'Upload resume'}</Button>{selectedFile&&<Button variant="ghost" onClick={handleClearFile} disabled={uploadState===UPLOAD_STATES.UPLOADING}>Clear selection</Button>}</div></div>{uploadError&&<div className="mt-4"><ErrorState message={uploadError}/></div>}{uploadState===UPLOAD_STATES.SUCCESS&&!resume?.analyzedAt&&<div className="mt-4"><SuccessState>Resume uploaded. Analyze it below to reveal your skills and experience.</SuccessState></div>}
    {hasUploadedResume?<div className="file-summary"><FileText size={22} color="var(--primary)"/><div><strong>{resume.originalFileName || 'Text resume'}</strong><small>{resume.uploadedAt ? `Uploaded ${new Date(resume.uploadedAt).toLocaleDateString()}` : 'Resume text saved'}{resume.fileSize?` · ${formatBytes(resume.fileSize)}`:''}</small></div><Badge tone={resume.analyzedAt?'success':'warning'}>{resume.analyzedAt?'Analyzed':'Needs analysis'}</Badge></div>:<p className="muted text-sm mt-4">Upload your resume to unlock personalized interviews.</p>}
    <form onSubmit={handleResumeAnalyze} className="mt-6"><div className="field"><label htmlFor="resume-text">Or paste resume text</label><textarea id="resume-text" rows={4} value={resumeText} onChange={e=>setResumeText(e.target.value)} placeholder={hasUploadedResume?'Leave blank to analyze your uploaded resume…':'Paste your resume text here…'} aria-describedby="resume-help"/><small id="resume-help">{hasUploadedResume?'Leave this blank to use your current resume.':'You can also analyze plain text instead of uploading a PDF.'}</small></div><Button className="mt-4" type="submit" busy={isAnalyzingResume} disabled={!resumeText.trim()&&!hasUploadedResume}>{isAnalyzingResume?'Analyzing resume…':resume?.analyzedAt?'Re-analyze resume':'Analyze Resume'}</Button></form></Card>
    {resume?.analyzedAt&&<><Card><SectionHeader title="Resume analysis" description="Your background, structured for better preparation." action={<Badge tone="success"><CheckCircle2 size={12} className="mr-1"/>Analyzed</Badge>}/><p className="prose-text mb-6">{resume.summary}</p><div className="grid-two">{[['technical','Technical skills'],['programmingLanguages','Languages'],['frameworks','Frameworks'],['databases','Databases'],['tools','Tools'],['softSkills','Soft skills']].map(([key,label])=><div key={key}><h3 className="mb-3">{label}</h3><Chips items={resume.skills?.[key]} tone="primary"/></div>)}</div></Card>
    <Card><SectionHeader title="Experience & projects"/><div className="analysis-group"><h3>Experience</h3>{resume.experience?.length?resume.experience.map((item,i)=><div className="analysis-item" key={i}><h3>{item.title}</h3><p>{item.organization} · {item.duration}</p><ul className="bullet-list text-sm">{item.highlights?.map((h,j)=><li key={j}>{h}</li>)}</ul></div>):<p className="muted text-sm">No experience listed.</p>}<h3 className="mt-4">Projects</h3>{resume.projects?.length?resume.projects.map((item,i)=><div className="analysis-item" key={i}><h3 className="mb-2">{item.name}</h3><Chips items={item.technologies}/><ul className="bullet-list text-sm mt-3">{item.highlights?.map((h,j)=><li key={j}>{h}</li>)}</ul></div>):<p className="muted text-sm">No projects listed.</p>}<h3 className="mt-4">Education</h3>{resume.education?.length?resume.education.map((item,i)=><div className="analysis-item" key={i}><h3>{item.degree}</h3><p>{item.institution} · {item.duration}</p></div>):<p className="muted text-sm">No education listed.</p>}</div></Card>
    <div className="grid-two"><FeedbackList title="Strengths" items={resume.strengths} tone="positive"/><FeedbackList title="Areas to improve" items={resume.weaknesses} tone="attention"/><FeedbackList title="Missing information" items={resume.missingInformation}/><FeedbackList title="Suggestions" items={resume.improvementSuggestions}/></div></>}
    </div>}
    {tab==='job-description'&&<div className="stack"><Card><SectionHeader title="Your target job" description="Paste a job description to identify what the role calls for."/><form onSubmit={handleJdSubmit}><div className="field"><label htmlFor="jd-text">Job description</label><textarea id="jd-text" rows={8} value={jdText} onChange={e=>setJdText(e.target.value)} placeholder="Paste the responsibilities, requirements and preferred skills…"/></div><Button className="mt-4" type="submit" busy={isSubmittingJd} disabled={!jdText.trim()}>{isSubmittingJd?'Analyzing job description…':jd?.analyzedAt?'Update job description':'Analyze Job Description'}</Button></form></Card>{jd?.analyzedAt?<Card><SectionHeader title={jd.role || 'Job description analysis'} description={jd.experienceRequirements} action={<Badge tone="success">Analyzed</Badge>}/><div className="grid-two"><div><h3 className="mb-3">Required skills</h3><Chips items={jd.requiredSkills} tone="primary"/></div><div><h3 className="mb-3">Preferred skills</h3><Chips items={jd.preferredSkills}/></div><div className="full"><FeedbackList title="Responsibilities" items={jd.responsibilities}/></div><div className="full"><h3 className="mb-3">Keywords</h3><Chips items={jd.keywords}/></div></div></Card>:<Card><EmptyState title="A clearer target makes better practice" description="Add a job description to compare your skills against a target role."/></Card>}</div>}
    {tab==='match'&&<div className="stack"><Card><SectionHeader title="Requirements match" description="Resume-to-JD requirements match — not a prediction of hiring success." action={canMatch&&<Button variant="outline" onClick={handleGenerateMatch} busy={isGeneratingMatch}>{isGeneratingMatch?'Comparing…':match?.analyzedAt?'Refresh match':'Generate match'}</Button>}/>{!canMatch?<EmptyState title="Bring both sides together" description="Analyze your resume and job description first to see your requirements match." action={<ButtonLink variant="outline" to="/profile#resume">Review your profile</ButtonLink>}/>:match?.analyzedAt?<><div className="match-score">{match.matchScore}<span className="text-2xl">%</span></div><p className="muted text-xs mb-4">Requirements alignment</p><progress className="progress-bar mb-6" value={match.matchScore} max={100} aria-label="Requirements match"/><p className="prose-text">{match.explanation}</p></>:<EmptyState title="Your context is ready" description="Generate a match analysis to find overlapping skills and preparation priorities."/>}</Card>{canMatch&&match?.analyzedAt&&<><div className="grid-three"><Card><h3 className="mb-4">Matched skills</h3><Chips items={match.matchedSkills} tone="success"/></Card><Card><h3 className="mb-4">Missing skills</h3><Chips items={match.missingSkills} tone="danger"/></Card><Card><h3 className="mb-4">Partial matches</h3><Chips items={match.partialMatches} tone="warning"/></Card></div><Card><SectionHeader title="Your preparation priorities" description="Turn skill gaps into a focused practice plan."/><FeedbackList title="Before your next interview" items={match.preparationPriorities} ordered/><div className="mt-6"><ButtonLink to="/interview/setup" state={{interviewMode:'Personalized'}}>Start Personalized Interview<ArrowRight size={16}/></ButtonLink></div></Card></>}</div>}
  </div>;
}

