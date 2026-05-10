import { AppProvider } from './hooks/AppContext';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;