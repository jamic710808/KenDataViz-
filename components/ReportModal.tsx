import React from 'react';
import { X, FileText } from 'lucide-react';
import { AnalysisResult, ColumnStats } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    analysis: AnalysisResult | null;
}

const ReportModal: React.FC<Props> = ({ isOpen, onClose, analysis }) => {
    if (!isOpen || !analysis) return null;

    const dateStr = new Date().toLocaleDateString('zh-TW', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold flex items-center">
                        <FileText className="mr-2 text-primary" /> 資料分析報告
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-8 prose max-w-none">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">資料分析報告</h1>
                        <p className="text-gray-500">生成時間: {dateStr}</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">1. 資料概覽</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <span className="block text-gray-500 text-sm">總列數 (Rows)</span>
                                <span className="text-2xl font-bold text-primary">{analysis.rows}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <span className="block text-gray-500 text-sm">總欄數 (Columns)</span>
                                <span className="text-2xl font-bold text-primary">{analysis.columns}</span>
                            </div>
                             <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <span className="block text-gray-500 text-sm">數值欄位</span>
                                <span className="text-2xl font-bold text-primary">
                                    {Object.values(analysis.columnTypes).filter(t => t === 'number').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">2. 關鍵統計分析</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(analysis.stats).map(([col, stat]: [string, ColumnStats]) => (
                                <div key={col} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-lg mb-2 text-primary">{col}</h4>
                                    {stat.mean !== undefined ? (
                                        <ul className="text-sm space-y-1 text-gray-600">
                                            <li className="flex justify-between"><span>平均值 (Mean):</span> <span>{stat.mean}</span></li>
                                            <li className="flex justify-between"><span>中位數 (Median):</span> <span>{stat.median}</span></li>
                                            <li className="flex justify-between"><span>最小/最大 (Min/Max):</span> <span>{stat.min} / {stat.max}</span></li>
                                            <li className="flex justify-between"><span>標準差 (StdDev):</span> <span>{stat.stdDev}</span></li>
                                        </ul>
                                    ) : (
                                        <ul className="text-sm space-y-1 text-gray-600">
                                            <li className="flex justify-between"><span>唯一值 (Unique):</span> <span>{stat.uniqueValues}</span></li>
                                            <li className="flex justify-between"><span>最常見 (Most Freq):</span> <span>{stat.mostFrequent}</span></li>
                                            <li className="flex justify-between"><span>頻率 (Frequency):</span> <span>{stat.mostFrequentCount} ({stat.mostFrequentPercentage}%)</span></li>
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                         <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">3. 智慧數據洞察</h3>
                         <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
                             <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                 {analysis.insights.map((insight, idx) => (
                                     <li key={idx}>{insight}</li>
                                 ))}
                             </ul>
                         </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition mr-3">
                        關閉
                    </button>
                    <button onClick={() => window.print()} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-medium transition">
                        列印報告
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;