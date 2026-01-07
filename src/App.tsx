import {AppProvider, useApp} from './context/AppStore';
import {TitleBar} from './components/layout/TitleBar';
import {MainLayout} from './components/layout/MainLayout';
import {WelcomeScreen} from './components/features/welcome/WelcomeScreen';
import './App.css';

const AppView = () => {
    const {isConnected} = useApp();
    return (
        <div className="flex-1 relative overflow-hidden flex flex-col">
            {isConnected ? <MainLayout/> : <WelcomeScreen/>}
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            {/* Main container with app-root class for artifact fix */}
            <div className="app-root flex flex-col h-screen w-screen bg-zinc-950 text-foreground overflow-hidden">
                <TitleBar/>
                <AppView/>
            </div>
        </AppProvider>
    );
}

export default App;