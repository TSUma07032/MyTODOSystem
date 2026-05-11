import { AppProvider } from './hooks/AppContext';
import {ChoiceLayout} from './components/layout/ChoiceLayout';

function App() {
  return (
    <AppProvider>
      <ChoiceLayout />
    </AppProvider>
  );
}

export default App;