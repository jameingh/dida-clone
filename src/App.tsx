import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/Layout/MainLayout';
import TaskList from './components/Task/TaskList';
import TaskDetail from './components/Task/TaskDetail';
import Toast from './components/Common/Toast';
import AlertDialog from './components/Common/AlertDialog';
import ReminderManager from './components/Task/ReminderManager';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <div className="flex h-full">
          <div className="flex-1">
            <TaskList />
          </div>
          <TaskDetail />
        </div>
      </MainLayout>
      <Toast />
      <AlertDialog />
      <ReminderManager />
    </QueryClientProvider>
  );
}

export default App;
