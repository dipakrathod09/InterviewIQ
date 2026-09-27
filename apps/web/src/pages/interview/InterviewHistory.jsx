import { useCallback, useEffect, useState } from 'react';
import * as interviewService from '../../services/interviewService';
import { Plus } from 'lucide-react';
import { Card, PageHeader, ButtonLink, LoadingState, ErrorState, EmptyState, SessionList } from '../../components/ui';
export default function InterviewHistory() {
  const [sessions,setSessions]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{setSessions(await interviewService.getSessions());}catch{setError('We couldn’t load your interview history.');}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  return <><PageHeader eyebrow="EVERY SESSION IS A STEP FORWARD" title="Your interviews" description="Continue your practice or revisit what you've learned." action={<ButtonLink to="/interview/setup"><Plus size={16}/>New interview</ButtonLink>}/>{loading?<LoadingState label="Loading your interviews…"/>:error?<ErrorState message={error} retry={load}/>:<Card>{sessions.length?<SessionList sessions={sessions}/>:<EmptyState title="Your interview journey starts here" description="No interviews yet. Choose a role and start your first practice session." action={<ButtonLink to="/interview/setup">Start your first interview</ButtonLink>}/>}</Card>}</>;
}
