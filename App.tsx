import React, { useState, useRef, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ReportModal from './components/ReportModal';
import { parseFile, analyzeData } from './services/dataService';
import { DataRow, AnalysisResult, NotificationState, ChartRecommendation, ColumnStats, FilterCondition } from './types';
import { 
    UploadCloud, FileText, XCircle, Activity, 
    BarChart, PieChart, TrendingUp, Grid,
    RefreshCw, Download, Image as ImageIcon,
    Layout, BarChart2, Calculator, AlertCircle, Trash2,
    Info, Database, PlayCircle, CheckCircle2, Filter, Plus, X
} from 'lucide-react';
import { 
    BarChart as ReBarChart, Bar, LineChart as ReLineChart, Line, 
    PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
    // --- State ---
    const [data, setData] = useState<DataRow[] | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [fileSize, setFileSize] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [notification, setNotification] = useState<NotificationState>({ show: false, title: '', message: '', type: 'info' });
    const [showReport, setShowReport] = useState(false);

    // Chart State
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'area'>('bar');
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [chartTitle, setChartTitle] = useState('');
    const [chartColorTheme, setChartColorTheme] = useState('blue');
    const [showLegend, setShowLegend] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [exportBg, setExportBg] = useState<'transparent' | 'white'>('transparent');
    
    // Filter State
    const [filters, setFilters] = useState<FilterCondition[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    // --- Helpers ---
    const showNotify = (title: string, message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ show: true, title, message, type });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const triggerDownload = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Handlers ---
    const handleFile = async (file: File) => {
        if (!file) return;
        
        try {
            const { data: parsedData, headers: parsedHeaders } = await parseFile(file);
            setData(parsedData);
            setHeaders(parsedHeaders);
            setFileName(file.name);
            setFileSize(formatFileSize(file.size));
            setXAxis(parsedHeaders[0] || '');
            setYAxis(parsedHeaders[1] || parsedHeaders[0] || '');
            setFilters([]); // Reset filters on new file
            
            // Clear previous analysis
            setAnalysis(null);
            showNotify('成功', '檔案上傳成功', 'success');
        } catch (error) {
            console.error(error);
            showNotify('錯誤', '檔案解析失敗，請檢查格式', 'error');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const removeFile = () => {
        setData(null);
        setHeaders([]);
        setFileName('');
        setAnalysis(null);
        setFilters([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showNotify('資訊', '檔案已移除，您可以重新上傳', 'info');
    };

    const handleDemoData = () => {
        const generateDemoData = () => {
            const data: DataRow[] = [];
            const products = ["筆記型電腦", "智慧型手機", "平板電腦", "耳機", "顯示器", "智慧手錶"];
            const regions = ["台北", "台中", "高雄", "新竹", "台南"];
            
            // Generate data for full year 2023
            for (let month = 1; month <= 12; month++) {
                // Generate 5-8 records per month
                const recordsCount = 5 + Math.floor(Math.random() * 4);
                
                for (let i = 0; i < recordsCount; i++) {
                    const day = 1 + Math.floor(Math.random() * 28); // 1-28 to be safe
                    const dateStr = `2023-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const product = products[Math.floor(Math.random() * products.length)];
                    const region = regions[Math.floor(Math.random() * regions.length)];
                    
                    // Logic to make numbers somewhat realistic
                    let basePrice = 0;
                    if (product === "筆記型電腦") basePrice = 35000;
                    else if (product === "智慧型手機") basePrice = 25000;
                    else if (product === "顯示器") basePrice = 10000;
                    else if (product === "平板電腦") basePrice = 12000;
                    else if (product === "智慧手錶") basePrice = 8000;
                    else basePrice = 3000; // 耳機

                    // Variance +/- 20%
                    const sales = Math.floor(basePrice * (0.8 + Math.random() * 0.4));
                    const cost = Math.floor(sales * (0.65 + Math.random() * 0.15)); // 65-80% margin
                    const profit = sales - cost;
                    const satisfaction = parseFloat((3.5 + Math.random() * 1.5).toFixed(1)); // 3.5 - 5.0

                    data.push({
                        "日期": dateStr,
                        "產品": product,
                        "地區": region,
                        "銷售額": sales,
                        "成本": cost,
                        "利潤": profit,
                        "滿意度": satisfaction
                    });
                }
            }
            // Sort by date
            return data.sort((a, b) => String(a["日期"]).localeCompare(String(b["日期"])));
        };

        const demoData = generateDemoData();

        setData(demoData);
        setHeaders(Object.keys(demoData[0]));
        setFileName("Demo_Sales_Data_2023.csv");
        setFileSize(`~${Math.ceil(JSON.stringify(demoData).length / 1024)}KB`);
        setXAxis("日期"); // Changed default X to Date for better trend visualization
        setYAxis("銷售額");
        setFilters([]);
        setAnalysis(null);
        showNotify('成功', '已載入 2023 全年度範例資料，請點擊「智慧分析」以查看結果', 'success');
        
        // Scroll to analysis section hint
        setTimeout(() => {
            document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    };

    const handleAnalysis = () => {
        if (!data || !headers.length) return;
        setIsAnalyzing(true);
        
        // Simulate fake delay for "AI" feel
        setTimeout(() => {
            const result = analyzeData(data, headers);
            setAnalysis(result);
            setIsAnalyzing(false);
            showNotify('完成', '智慧分析已完成', 'success');
        }, 1500);
    };

    const applyRecommendation = (rec: ChartRecommendation) => {
        setChartType(rec.type as any); // Type assertion for simplicity
        setXAxis(rec.columns.x);
        if (rec.columns.y) setYAxis(rec.columns.y);
        setChartTitle(rec.title);
        showNotify('應用', `已切換至 ${rec.title}`, 'info');
        
        // Scroll to visualizer
        document.getElementById('visualize')?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Filter Logic ---
    const addFilter = () => {
        if (!headers.length) return;
        const newFilter: FilterCondition = {
            id: Date.now().toString(),
            column: headers[0],
            operator: 'eq',
            value: ''
        };
        setFilters([...filters, newFilter]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id: string, field: keyof FilterCondition, value: any) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    // Derived state for filtered data
    const filteredData = useMemo(() => {
        if (!data) return [];
        if (filters.length === 0) return data;

        return data.filter(row => {
            return filters.every(f => {
                const rowVal = row[f.column];
                const val = String(rowVal).toLowerCase();
                const filterVal = String(f.value).toLowerCase();
                const filterVal2 = f.value2 ? String(f.value2).toLowerCase() : '';

                // Handle numbers for range/gt/lt
                const numRowVal = parseFloat(String(rowVal));
                const numFilterVal = parseFloat(String(f.value));
                const numFilterVal2 = parseFloat(String(f.value2));
                const isNum = !isNaN(numRowVal) && !isNaN(numFilterVal);

                switch (f.operator) {
                    case 'eq': return val === filterVal;
                    case 'neq': return val !== filterVal;
                    case 'contains': return val.includes(filterVal);
                    case 'gt': return isNum ? numRowVal > numFilterVal : val > filterVal;
                    case 'gte': return isNum ? numRowVal >= numFilterVal : val >= filterVal;
                    case 'lt': return isNum ? numRowVal < numFilterVal : val < filterVal;
                    case 'lte': return isNum ? numRowVal <= numFilterVal : val <= filterVal;
                    case 'range':
                        if (isNum && !isNaN(numFilterVal2)) {
                            return numRowVal >= numFilterVal && numRowVal <= numFilterVal2;
                        }
                        // String/Date range comparison
                        return val >= filterVal && val <= filterVal2;
                    default: return true;
                }
            });
        });
    }, [data, filters]);

    // --- Render Chart ---
    const THEME_COLORS = {
        blue: ['#165DFF', '#4080FF', '#7AA3FF', '#B3CFFF'],
        green: ['#00B42A', '#23C343', '#7BE188', '#B7F0BF'],
        purple: ['#722ED1', '#9E66E4', '#C59BF6', '#E4CCFD'],
        orange: ['#FF7D00', '#FF9A2E', '#FFB766', '#FFD499'],
        red: ['#F53F3F', '#FF7D7D', '#FFB3B3', '#FFDEDE'],
        yellow: ['#FADC19', '#FCE666', '#FDF099', '#FEFACC'],
        gray: ['#86909C', '#C9CDD4', '#E5E6EB', '#F2F3F5'],
    };

    const getColors = (count: number) => {
        const theme = THEME_COLORS[chartColorTheme as keyof typeof THEME_COLORS] || THEME_COLORS.blue;
        const res = [];
        // Ensure we always have at least one color even if count is 0 or low
        const safeCount = Math.max(count, 1);
        for(let i=0; i<safeCount; i++) res.push(theme[i % theme.length]);
        return res;
    };

    const renderChart = () => {
        if (!filteredData || !xAxis) return null;

        if (filteredData.length === 0) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                    <Filter size={48} className="mb-4 text-gray-300" />
                    <p>篩選後沒有資料，請調整篩選條件</p>
                </div>
            );
        }

        // Requirement check for Cartesian charts
        if (['bar', 'line', 'area', 'scatter'].includes(chartType) && !yAxis) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 animate-fade-in">
                    <AlertCircle size={48} className="mb-4 text-secondary/50" />
                    <p className="font-medium">請選擇 Y 軸（數值欄位）</p>
                    <p className="text-sm mt-2">此圖表類型需要數值數據才能顯示</p>
                </div>
            );
        }

        // Prepare data: limit to 30 items for readability if too large
        // IMPORTANT: Use filteredData here
        let chartData = filteredData.slice(0, 30); 
        
        // Handle pie chart aggregation
        if (chartType === 'pie' || chartType === 'doughnut') {
            const counts: Record<string, number> = {};
            filteredData.forEach(row => {
                const key = String(row[xAxis]);
                counts[key] = (counts[key] || 0) + 1;
            });
            chartData = Object.entries(counts).map(([name, value]) => ({ [xAxis]: name, [yAxis || 'value']: value })).slice(0, 10);
        }

        const colors = getColors(chartData.length);
        const CommonProps = { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 } };

        try {
            switch (chartType) {
                case 'bar':
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart {...CommonProps}>
                                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                                <XAxis dataKey={xAxis} tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                {showLegend && <Legend />}
                                <Bar dataKey={yAxis} fill={colors[0]} radius={[4, 4, 0, 0]} name={yAxis} />
                            </ReBarChart>
                        </ResponsiveContainer>
                    );
                case 'line':
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <ReLineChart {...CommonProps}>
                                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                                <XAxis dataKey={xAxis} tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                {showLegend && <Legend />}
                                <Line type="monotone" dataKey={yAxis} stroke={colors[0]} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name={yAxis} />
                            </ReLineChart>
                        </ResponsiveContainer>
                    );
                case 'area':
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart {...CommonProps}>
                                {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                                <XAxis dataKey={xAxis} tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <Tooltip />
                                {showLegend && <Legend />}
                                <Area type="monotone" dataKey={yAxis} stroke={colors[0]} fill={colors[2]} />
                            </AreaChart>
                        </ResponsiveContainer>
                    );
                case 'pie':
                case 'doughnut':
                    const valKey = chartType === 'pie' && !yAxis ? 'value' : (yAxis || 'value');
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Tooltip />
                                {showLegend && <Legend />}
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={chartType === 'doughnut' ? 60 : 0}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey={valKey}
                                    nameKey={xAxis}
                                    label
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                            </RePieChart>
                        </ResponsiveContainer>
                    );
                case 'radar':
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey={xAxis} />
                                <PolarRadiusAxis />
                                <Radar name={yAxis} dataKey={yAxis} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
                                <Tooltip />
                                {showLegend && <Legend />}
                            </RadarChart>
                        </ResponsiveContainer>
                    );
                default:
                    return null;
            }
        } catch (e) {
            console.error("Chart render error:", e);
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-red-400">
                    <AlertCircle size={48} className="mb-4" />
                    <p>圖表繪製發生錯誤，請嘗試更換欄位</p>
                </div>
            );
        }
    };

    // --- Export Logic ---
    const handleExport = async (format: string) => {
        if (!filteredData || !chartRef.current) return showNotify('錯誤', '沒有可匯出的資料或圖表', 'error');
        
        showNotify('處理中', `正在匯出圖表為 ${format.toUpperCase()}...`, 'info');
        
        try {
            // Find the SVG element inside the chart container for pure SVG export
            const svgElement = chartRef.current.querySelector('svg');
            
            if (format === 'svg' && svgElement) {
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                triggerDownload(url, `${fileName.split('.')[0] || 'chart'}.svg`);
                showNotify('成功', '匯出成功', 'success');
                return;
            }

            // Capture element as canvas for PNG, JPG, PDF
            const canvas = await html2canvas(chartRef.current, {
                scale: 2, // High resolution
                backgroundColor: exportBg === 'white' ? '#ffffff' : null
            });

            const baseName = fileName.split('.')[0] || 'chart';

            if (format === 'png') {
                const image = canvas.toDataURL("image/png");
                triggerDownload(image, `${baseName}.png`);
            } else if (format === 'jpg') {
                const image = canvas.toDataURL("image/jpeg", 0.9);
                triggerDownload(image, `${baseName}.jpg`);
            } else if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                });
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${baseName}.pdf`);
            }
            
            showNotify('成功', '匯出成功', 'success');

        } catch (error) {
            console.error('Export error:', error);
            showNotify('錯誤', '匯出失敗，請稍後再試', 'error');
        }
    };

    // --- Render Helpers ---
    const renderTypeDistribution = () => {
        if (!analysis) return null;
        const total = analysis.columns;
        const types = {
            '數值': analysis.typeCounts['number'] || 0,
            '文字': analysis.typeCounts['text'] || 0,
            '日期': analysis.typeCounts['date'] || 0,
            '布林': analysis.typeCounts['boolean'] || 0,
        };
        
        return (
            <div className="space-y-3">
                {Object.entries(types).map(([type, count]) => {
                    if (count === 0) return null;
                    const percent = (count / total) * 100;
                    return (
                        <div key={type}>
                            <div className="flex justify-between text-sm mb-1 text-gray-600">
                                <span>{type}</span>
                                <span>{count} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <Navbar hasData={!!data} onReset={removeFile} />
            <Notification notification={notification} onClose={() => setNotification(prev => ({ ...prev, show: false }))} />
            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} analysis={analysis} />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                
                {/* Hero */}
                <section className="text-center sm:text-left mb-10 animate-fade-in">
                    <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-gray-900 mb-2">KenDataViz 資料視覺化工具</h1>
                    <p className="text-gray-600 max-w-3xl text-lg">上傳您的 Excel 或 CSV 檔案，快速生成互動式圖表和視覺化報表，幫助您更好地理解和展示資料。</p>
                </section>

                {/* Upload Section */}
                <section id="upload" className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                        <UploadCloud className="text-primary mr-2" /> 上傳資料
                    </h2>

                    {!data && (
                        <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-blue-50 transition-all cursor-pointer relative group"
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-blue-50'); }}
                            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-blue-50'); }}
                            onDrop={(e) => { 
                                e.preventDefault(); 
                                e.currentTarget.classList.remove('border-primary', 'bg-blue-50'); 
                                handleDrop(e); 
                            }}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".xlsx,.xls,.csv" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFile(e.target.files[0]);
                                        e.target.value = ''; 
                                    }
                                }} 
                            />
                            
                            <div onClick={() => fileInputRef.current?.click()} className="mb-6">
                                <FileText className="mx-auto text-gray-400 mb-4 group-hover:text-primary transition-colors" size={48} />
                                <p className="text-gray-600 mb-2 text-lg font-medium">拖放檔案到此處，或 <span className="text-primary underline">點擊瀏覽檔案</span></p>
                                <p className="text-gray-400 text-sm">支援 .xlsx, .xls, .csv 格式</p>
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">或者</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <div className="mt-4">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent file input click
                                        handleDemoData();
                                    }}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary hover:border-primary transition-all"
                                >
                                    <PlayCircle size={16} className="mr-2 text-secondary" />
                                    使用範例資料演示
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Data Format Instructions */}
                    {!data && (
                        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 animate-fade-in">
                            <h3 className="flex items-center text-sm font-bold text-blue-800 mb-3">
                                <Info size={18} className="mr-2" /> 資料格式說明與注意事項
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><CheckCircle2 size={14} className="mr-1 text-green-500"/> 支援格式</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Excel:</strong> .xlsx, .xls</li>
                                        <li><strong>CSV:</strong> .csv (建議使用 UTF-8 編碼)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Database size={14} className="mr-1 text-blue-500"/> 資料結構建議</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>第一列必須是標題列</strong> (例如：日期, 產品, 金額)。</li>
                                        <li>確保同一欄位的資料類型一致 (例如：金額欄位不要混雜文字)。</li>
                                        <li>避免使用合併儲存格或複雜的格式。</li>
                                        <li>日期格式建議為 YYYY-MM-DD 或 YYYY/MM/DD。</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {data && (
                        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
                            <div className="flex items-center">
                                <FileText className="text-primary mr-3" size={24} />
                                <div>
                                    <p className="font-semibold text-gray-900">{fileName}</p>
                                    <p className="text-sm text-gray-500">{fileSize} • {data.length} 列</p>
                                </div>
                            </div>
                            <button onClick={removeFile} className="flex items-center text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50" title="移除此檔案">
                                <Trash2 size={20} className="mr-2" />
                                <span className="font-medium text-sm">清除資料</span>
                            </button>
                        </div>
                    )}

                    {/* Data Preview Table */}
                    {data && (
                        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-3 px-1">資料預覽</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {headers.map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {headers.map(h => (
                                                <td key={`${i}-${h}`} className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{String(row[h])}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {data.length > 5 && (
                                        <tr>
                                            <td colSpan={headers.length} className="px-4 py-2 text-center text-xs text-gray-400 italic">... 還有 {data.length - 5} 列</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Analysis Section */}
                <section id="analysis" className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all ${!data ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                        <Activity className="text-primary mr-2" /> 智慧分析
                    </h2>

                    <div className="mb-6">
                        <button 
                            onClick={handleAnalysis}
                            disabled={isAnalyzing}
                            className={`px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all flex items-center font-medium ${isAnalyzing ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {isAnalyzing ? <RefreshCw className="animate-spin mr-2" /> : <Activity className="mr-2" />}
                            {isAnalyzing ? '正在分析資料...' : '智慧分析資料'}
                        </button>
                    </div>

                    {/* Analysis Progress */}
                    {isAnalyzing && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                            <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    )}

                    {/* Results */}
                    {analysis && !isAnalyzing && (
                        <div className="animate-fade-in space-y-8">
                            {/* 1. Dataset Overview & Type Distribution */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold mb-3 flex items-center text-gray-800"><Layout className="mr-2 w-4 h-4 text-primary"/> 資料概覽</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded shadow-sm">
                                            <span className="text-xs text-gray-500 uppercase">總列數</span>
                                            <p className="text-xl font-bold text-gray-800">{analysis.rows}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded shadow-sm">
                                            <span className="text-xs text-gray-500 uppercase">欄位數</span>
                                            <p className="text-xl font-bold text-gray-800">{analysis.columns}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">資料類型分佈</h4>
                                        {renderTypeDistribution()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold mb-3 flex items-center text-gray-800"><TrendingUp className="mr-2 w-4 h-4 text-primary"/> 相關性分析</h3>
                                    {analysis.correlations.length > 0 ? (
                                        <div className="space-y-3">
                                            {analysis.correlations.slice(0, 4).map((corr, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded shadow-sm flex justify-between items-center border-l-4 border-green-500">
                                                    <span className="font-medium text-sm text-gray-700">{corr.column1} vs {corr.column2}</span>
                                                    <span className={`font-bold ${Math.abs(corr.correlation) > 0.7 ? 'text-green-600' : 'text-gray-600'}`}>{corr.correlation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                                            <p>數值欄位不足以進行相關性分析</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Key Statistics */}
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-800 flex items-center"><Calculator className="mr-2 w-4 h-4 text-primary"/> 關鍵統計數據</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.entries(analysis.stats).map(([col, stat]: [string, ColumnStats]) => (
                                        <div key={col} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <h4 className="font-bold text-sm text-primary mb-2 truncate" title={col}>{col}</h4>
                                            {stat.mean !== undefined ? (
                                                <div className="space-y-1 text-xs text-gray-600">
                                                    <div className="flex justify-between"><span>平均:</span> <span className="font-medium">{stat.mean}</span></div>
                                                    <div className="flex justify-between"><span>最大:</span> <span className="font-medium">{stat.max}</span></div>
                                                    <div className="flex justify-between"><span>最小:</span> <span className="font-medium">{stat.min}</span></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1 text-xs text-gray-600">
                                                    <div className="flex justify-between"><span>唯一值:</span> <span className="font-medium">{stat.uniqueValues}</span></div>
                                                    <div className="flex justify-between"><span>最常見:</span> <span className="font-medium truncate max-w-[80px]" title={String(stat.mostFrequent)}>{stat.mostFrequent}</span></div>
                                                    <div className="flex justify-between"><span>佔比:</span> <span className="font-medium">{stat.mostFrequentPercentage}%</span></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Recommendations */}
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-800 flex items-center"><BarChart2 className="mr-2 w-4 h-4 text-primary"/> 智能圖表推薦</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {analysis.recommendations.map((rec, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer group" onClick={() => applyRecommendation(rec)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase">{rec.type}</span>
                                                <span className="text-xs text-gray-400">推薦 #{idx + 1}</span>
                                            </div>
                                            <h4 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-primary transition-colors">{rec.title}</h4>
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{rec.description}</p>
                                            <button className="text-xs font-medium text-primary hover:underline flex items-center">
                                                生成圖表 <Activity size={10} className="ml-1" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Report Actions */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t">
                                <button onClick={() => setShowReport(true)} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-orange-600 transition shadow-sm text-sm font-medium flex items-center">
                                    <FileText size={16} className="mr-2" /> 生成完整報告
                                </button>
                                <button onClick={() => handleExport('html')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition shadow-sm text-sm font-medium flex items-center">
                                    <Download size={16} className="mr-2" /> 匯出報告
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Visualizer Section */}
                <section id="visualize" className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all ${!data ? 'opacity-50 pointer-events-none' : ''}`}>
                     <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                        <PieChart className="text-primary mr-2" /> 視覺化設定
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Controls */}
                        <div className="space-y-6">
                            
                            {/* DATA FILTER SECTION - ADDED */}
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                        <Filter size={12} className="mr-1"/> 資料篩選器 ({filters.length})
                                    </label>
                                    <button onClick={addFilter} className="text-primary hover:bg-blue-100 p-1 rounded transition">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                
                                {filters.length === 0 && (
                                    <p className="text-xs text-gray-400 italic text-center py-2">點擊 + 新增篩選條件 (例如：年度、數值範圍)</p>
                                )}

                                <div className="space-y-3">
                                    {filters.map((f, idx) => {
                                        const colType = analysis?.columnTypes[f.column] || 'text';
                                        return (
                                            <div key={f.id} className="bg-white p-2 rounded shadow-sm border border-gray-200 text-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-gray-400">條件 #{idx + 1}</span>
                                                    <button onClick={() => removeFilter(f.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                                </div>
                                                
                                                {/* Column Select */}
                                                <select 
                                                    value={f.column} 
                                                    onChange={e => updateFilter(f.id, 'column', e.target.value)} 
                                                    className="w-full p-1.5 mb-2 border rounded text-xs bg-gray-50 outline-none focus:border-primary"
                                                >
                                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>

                                                {/* Operator Select */}
                                                <select 
                                                    value={f.operator} 
                                                    onChange={e => updateFilter(f.id, 'operator', e.target.value)} 
                                                    className="w-full p-1.5 mb-2 border rounded text-xs bg-gray-50 outline-none focus:border-primary"
                                                >
                                                    <option value="eq">等於 (=)</option>
                                                    <option value="neq">不等於 (!=)</option>
                                                    <option value="contains">包含 (文字)</option>
                                                    <option value="gt">大於 (&gt;)</option>
                                                    <option value="lt">小於 (&lt;)</option>
                                                    <option value="range">介於 / 範圍 (Range)</option>
                                                </select>

                                                {/* Values Input */}
                                                <div className="flex space-x-2">
                                                    <input 
                                                        type={colType === 'date' ? 'date' : colType === 'number' ? 'number' : 'text'}
                                                        value={f.value} 
                                                        onChange={e => updateFilter(f.id, 'value', e.target.value)}
                                                        placeholder="值"
                                                        className="w-full p-1.5 border rounded text-xs outline-none focus:border-primary"
                                                    />
                                                    {f.operator === 'range' && (
                                                        <input 
                                                            type={colType === 'date' ? 'date' : colType === 'number' ? 'number' : 'text'}
                                                            value={f.value2 || ''} 
                                                            onChange={e => updateFilter(f.id, 'value2', e.target.value)}
                                                            placeholder="迄"
                                                            className="w-full p-1.5 border rounded text-xs outline-none focus:border-primary"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Chart Type */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">圖表類型</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'bar', icon: BarChart, label: '長條圖' },
                                        { id: 'line', icon: TrendingUp, label: '折線圖' },
                                        { id: 'pie', icon: PieChart, label: '圓餅圖' },
                                        { id: 'area', icon: Activity, label: '區域圖' },
                                        { id: 'radar', icon: Grid, label: '雷達圖' },
                                    ].map((t) => (
                                        <button 
                                            key={t.id}
                                            onClick={() => setChartType(t.id as any)}
                                            className={`p-2 rounded-md text-xs font-medium flex flex-col items-center justify-center transition-all ${chartType === t.id ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <t.icon size={16} className="mb-1" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Axes */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">X軸 / 類別</label>
                                    <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                                        <option value="">請選擇...</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Y軸 / 數值</label>
                                    <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                                        <option value="">請選擇...</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>

                             {/* Options */}
                             <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">圖表標題</label>
                                    <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} placeholder="請輸入圖表標題" className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-primary" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">顏色主題</label>
                                    <div className="flex space-x-2">
                                        {Object.keys(THEME_COLORS).map(color => (
                                            <button 
                                                key={color} 
                                                onClick={() => setChartColorTheme(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${chartColorTheme === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: (THEME_COLORS as any)[color][0] }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                                        <span className="text-sm text-gray-700">顯示圖例</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                                        <span className="text-sm text-gray-700">顯示網格線</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Chart Render Area */}
                        <div className="lg:col-span-3">
                            <div ref={chartRef} className="bg-white border-2 border-gray-100 rounded-xl h-[500px] p-4 flex flex-col relative group">
                                <h3 className="text-center font-bold text-gray-800 mb-2">{chartTitle}</h3>
                                {xAxis ? renderChart() : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-gray-300">
                                        <BarChart size={64} className="mb-4 opacity-20" />
                                        <p>請選擇 X 軸和 Y 軸以生成圖表</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                                <span>顯示 {filteredData ? Math.min(filteredData.length, 30) : 0} 筆資料 (共 {filteredData?.length || 0} 筆符合篩選)</span>
                                <button className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm flex items-center">
                                    <RefreshCw size={16} className="mr-2" /> 生成/重新整理圖表
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Export Section */}
                <section id="settings" className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all ${!data ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                        <Download className="text-primary mr-2" /> 匯出設定
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="font-semibold mb-4">匯出格式</h3>
                            <div className="space-y-3">
                                {['png', 'jpg', 'svg', 'pdf'].map(fmt => (
                                    <div key={fmt} onClick={() => handleExport(fmt)} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group">
                                        <div className="p-2 bg-gray-100 rounded group-hover:bg-white text-primary mr-3">
                                            {fmt === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                                        </div>
                                        <span className="text-sm font-medium uppercase text-gray-700">{fmt} 檔案</span>
                                        <Download size={16} className="ml-auto text-gray-400 group-hover:text-primary" />
                                    </div>
                                ))}
                            </div>
                         </div>
                         <div className="bg-gray-50 p-6 rounded-lg">
                             <h3 className="font-semibold mb-4">匯出選項</h3>
                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-sm text-gray-600 mb-1">檔名</label>
                                     <input type="text" value={fileName.split('.')[0] + '_chart'} readOnly className="w-full p-2 border rounded bg-white text-gray-600 text-sm" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-sm text-gray-600 mb-1">寬度 (px)</label>
                                         <input type="number" defaultValue={800} className="w-full p-2 border rounded bg-white text-sm" />
                                     </div>
                                     <div>
                                         <label className="block text-sm text-gray-600 mb-1">高度 (px)</label>
                                         <input type="number" defaultValue={600} className="w-full p-2 border rounded bg-white text-sm" />
                                     </div>
                                 </div>
                                 <div className="flex items-center mt-2">
                                     <input 
                                        type="radio" 
                                        name="bg" 
                                        id="bg-t" 
                                        checked={exportBg === 'transparent'} 
                                        onChange={() => setExportBg('transparent')} 
                                        className="mr-2" 
                                    />
                                     <label htmlFor="bg-t" className="text-sm text-gray-600 mr-4">透明</label>
                                     <input 
                                        type="radio" 
                                        name="bg" 
                                        id="bg-w" 
                                        checked={exportBg === 'white'} 
                                        onChange={() => setExportBg('white')} 
                                        className="mr-2" 
                                    />
                                     <label htmlFor="bg-w" className="text-sm text-gray-600">白色背景</label>
                                 </div>
                                 <button onClick={() => handleExport('png')} className="w-full mt-2 py-2 bg-secondary text-white rounded hover:bg-orange-600 transition text-sm font-medium">匯出圖表</button>
                             </div>
                         </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <BarChart2 className="text-primary mr-2" />
                            <span className="font-bold text-gray-900">KenDataViz</span>
                            <span className="text-gray-400 text-sm ml-4">© 2025 KenDataViz. 保留所有權利。</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-500">
                            <button className="hover:text-primary transition-colors">隱私權政策</button>
                            <button className="hover:text-primary transition-colors">使用條款</button>
                            <button className="hover:text-primary transition-colors">聯絡我們</button>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default App;