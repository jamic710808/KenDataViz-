import React from 'react';
import { BarChart2, Download, HelpCircle, User, Menu, Trash2 } from 'lucide-react';

interface NavbarProps {
    hasData?: boolean;
    onReset?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ hasData, onReset }) => {
    // Helper function to handle scrolling without triggering URL hash change
    // This prevents "refused to connect" errors in sandboxed iframes (like AI Studio preview)
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 transition-all duration-300 backdrop-blur-sm bg-white/90" id="navbar">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({top:0, behavior: 'smooth'})}>
                            <BarChart2 className="text-primary h-8 w-8 mr-2" />
                            <span className="text-xl font-bold tracking-tight text-gray-900">KenDataViz</span>
                        </div>
                        <div className="hidden sm:ml-10 sm:flex space-x-8">
                            <button onClick={() => scrollToSection('upload')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer">上傳資料</button>
                            <button onClick={() => scrollToSection('analysis')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer">智慧分析</button>
                            <button onClick={() => scrollToSection('visualize')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer">視覺化</button>
                            <button onClick={() => scrollToSection('settings')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer">設定</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {hasData && onReset && (
                             <button 
                                onClick={() => {
                                    if(window.confirm('確定要清除所有資料嗎？這將會重置所有分析結果。')) {
                                        onReset();
                                    }
                                }}
                                className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors text-sm font-medium mr-2"
                                title="清除所有資料以重新上傳"
                            >
                                <Trash2 size={16} className="mr-2" />
                                <span className="hidden md:inline">清除資料</span>
                                <span className="md:hidden">清除</span>
                            </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                            <HelpCircle size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                            <User size={20} />
                        </button>
                        <button className="hidden md:flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
                            <Download size={16} className="mr-2" />
                            匯出
                        </button>
                        <button className="sm:hidden p-2 text-gray-600">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;