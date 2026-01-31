import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IssueContext } from '../context/IssueContext';
import { LostFoundContext } from '../context/LostFoundContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssues must be used within IssueProvider');
  }
  return context;
};

export const useLostFound = () => {
  const context = useContext(LostFoundContext);
  if (!context) {
    throw new Error('useLostFound must be used within LostFoundProvider');
  }
  return context;
};
