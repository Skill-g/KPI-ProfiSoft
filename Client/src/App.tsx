import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/AppRouter';
import './assets/style/App.css';

const App = () =>{
  return (
    <BrowserRouter>
    <AppRouter></AppRouter>
    </BrowserRouter>
  );
};

export default App;