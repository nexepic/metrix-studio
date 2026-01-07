import { AppProvider, useApp } from './context/AppStore';
import { TitleBar } from './components/layout/TitleBar';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/features/welcome/WelcomeScreen';
import './App.css';

// Router component to decide view
const AppView = () => {
    const { isConnected } = useApp();
    return (
        <div className="flex-1 relative overflow-hidden flex flex-col">
            {isConnected ? <MainLayout /> : <WelcomeScreen />}
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            {/*
                Main Container
                - Removed borders to look cleaner
                - h-screen/w-screen ensures full coverage
                - bg-zinc-950 matches the theme
            */}
            <div className="flex flex-col h-screen w-screen bg-zinc-950 text-foreground overflow-hidden">
                {/* Global TitleBar (Always Visible) */}
                <TitleBar />

                {/* Viewport for Welcome or Main App */}
                <AppView />
            </div>
        </AppProvider>
    );
}

export default App;