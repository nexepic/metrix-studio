import { AppProvider, useApp } from './context/AppStore';
import { TitleBar } from './components/layout/TitleBar';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/features/welcome/WelcomeScreen';
import './App.css';

const AppRouter = () => {
    const { isConnected } = useApp();

    return (
        /*
           If connected, we show the IDE. If not, the Welcome Screen.
        */
        <div className="h-screen w-screen overflow-hidden">
            {isConnected ? <MainLayout /> : <WelcomeScreen />}
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            {/*
                The root is relative so the TitleBar can be 'absolute'
                and float on top of the AppRouter content.
            */}
            <div className="relative h-screen w-screen bg-[#09090b] text-foreground overflow-hidden">
                <TitleBar />
                <AppRouter />
            </div>
        </AppProvider>
    );
}

export default App;