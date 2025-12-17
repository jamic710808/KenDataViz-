import * as XLSX from 'xlsx';
import { DataRow, AnalysisResult, ColumnStats, CorrelationPair, ChartRecommendation } from '../types';

// Helper to detect column type
const detectColumnType = (data: DataRow[], key: string): string => {
    let isNumber = true;
    let isDate = true;
    let isBoolean = true;
    
    // Check first 20 rows
    const limit = Math.min(data.length, 20);
    
    for (let i = 0; i < limit; i++) {
        const val = data[i][key];
        if (val === null || val === undefined || val === '') continue;
        
        const strVal = String(val).trim();
        
        if (isNumber && isNaN(parseFloat(strVal))) isNumber = false;
        if (isDate) {
             const date = new Date(strVal);
             if (isNaN(date.getTime())) isDate = false;
        }
        if (isBoolean) {
            const lower = strVal.toLowerCase();
            if (!['true', 'false', '0', '1', 'yes', 'no'].includes(lower)) isBoolean = false;
        }
    }
    
    if (isBoolean) return 'boolean';
    if (isNumber) return 'number';
    if (isDate) return 'date';
    return 'text';
};

export const parseFile = async (file: File): Promise<{ data: DataRow[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                let workbook;
                if (file.name.endsWith('.csv')) {
                   // Force read as string for CSV to handle encoding better if needed, 
                   // but XLSX handles binary string well.
                   workbook = XLSX.read(data, { type: 'binary' });
                } else {
                   workbook = XLSX.read(data, { type: 'binary' });
                }
                
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<DataRow>(sheet);
                
                if (jsonData.length === 0) {
                    reject(new Error("檔案中沒有資料"));
                    return;
                }
                
                const headers = Object.keys(jsonData[0]);
                resolve({ data: jsonData, headers });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};

export const analyzeData = (data: DataRow[], headers: string[]): AnalysisResult => {
    const columnTypes: Record<string, string> = {};
    const typeCounts: Record<string, number> = { number: 0, text: 0, date: 0, boolean: 0 };
    const stats: Record<string, ColumnStats> = {};
    
    // 1. Detect Types
    headers.forEach(header => {
        const type = detectColumnType(data, header);
        columnTypes[header] = type;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // 2. Calculate Stats
    headers.forEach(header => {
        const type = columnTypes[header];
        const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');

        if (type === 'number') {
            const nums = values.map(v => parseFloat(String(v))).filter(n => !isNaN(n));
            if (nums.length === 0) return;

            nums.sort((a, b) => a - b);
            const sum = nums.reduce((a, b) => a + b, 0);
            const mean = sum / nums.length;
            const min = nums[0];
            const max = nums[nums.length - 1];
            const mid = Math.floor(nums.length / 2);
            const median = nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
            
            // StdDev
            const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nums.length;
            
            stats[header] = {
                count: nums.length,
                mean: parseFloat(mean.toFixed(2)),
                median: parseFloat(median.toFixed(2)),
                min,
                max,
                range: max - min,
                stdDev: parseFloat(Math.sqrt(variance).toFixed(2))
            };
        } else {
            // Text/Categorical stats
            const counts: Record<string, number> = {};
            values.forEach(v => {
                const s = String(v);
                counts[s] = (counts[s] || 0) + 1;
            });
            
            let mostFrequent = '';
            let mostFrequentCount = 0;
            
            Object.entries(counts).forEach(([k, v]) => {
                if (v > mostFrequentCount) {
                    mostFrequentCount = v;
                    mostFrequent = k;
                }
            });

            stats[header] = {
                count: values.length,
                uniqueValues: Object.keys(counts).length,
                mostFrequent,
                mostFrequentCount,
                mostFrequentPercentage: parseFloat(((mostFrequentCount / values.length) * 100).toFixed(2))
            };
        }
    });

    // 3. Correlations (Numeric only)
    const correlations: CorrelationPair[] = [];
    const numericHeaders = headers.filter(h => columnTypes[h] === 'number');
    
    if (numericHeaders.length >= 2) {
        for (let i = 0; i < numericHeaders.length; i++) {
            for (let j = i + 1; j < numericHeaders.length; j++) {
                const h1 = numericHeaders[i];
                const h2 = numericHeaders[j];
                
                const vals1 = [];
                const vals2 = [];
                
                for (const row of data) {
                    const v1 = parseFloat(String(row[h1]));
                    const v2 = parseFloat(String(row[h2]));
                    if (!isNaN(v1) && !isNaN(v2)) {
                        vals1.push(v1);
                        vals2.push(v2);
                    }
                }
                
                if (vals1.length < 2) continue;
                
                // Pearson Correlation
                const mean1 = vals1.reduce((a,b)=>a+b,0) / vals1.length;
                const mean2 = vals2.reduce((a,b)=>a+b,0) / vals2.length;
                
                let num = 0;
                let den1 = 0;
                let den2 = 0;
                
                for(let k=0; k<vals1.length; k++) {
                    const d1 = vals1[k] - mean1;
                    const d2 = vals2[k] - mean2;
                    num += d1 * d2;
                    den1 += d1 * d1;
                    den2 += d2 * d2;
                }
                
                const corr = den1 === 0 || den2 === 0 ? 0 : num / Math.sqrt(den1 * den2);
                correlations.push({
                    column1: h1,
                    column2: h2,
                    correlation: parseFloat(corr.toFixed(3))
                });
            }
        }
        correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    }

    // 4. Recommendations
    const recommendations: ChartRecommendation[] = [];
    const textHeaders = headers.filter(h => columnTypes[h] === 'text' || columnTypes[h] === 'boolean');
    
    // R1: Scatter for correlation
    if (numericHeaders.length >= 2) {
        recommendations.push({
            type: 'scatter',
            title: '相關性分析 (Scatter)',
            description: `探索 ${numericHeaders[0]} 與 ${numericHeaders[1]} 之間的關係`,
            columns: { x: numericHeaders[0], y: numericHeaders[1] },
            priority: 1
        });
    }
    
    // R2: Bar for categorical comparison
    if (textHeaders.length > 0 && numericHeaders.length > 0) {
        // Find a text column with low cardinality (good for bar charts)
        const goodCat = textHeaders.find(h => (stats[h]?.uniqueValues || 100) < 20) || textHeaders[0];
        
        recommendations.push({
            type: 'bar',
            title: '類別比較 (Bar)',
            description: `比較 ${numericHeaders[0]} (按 ${goodCat} 分組)`,
            columns: { x: goodCat, y: numericHeaders[0] },
            priority: 2
        });
    }

    // R3: Line for Trends (if date exists or strictly linear data)
    const dateHeader = headers.find(h => columnTypes[h] === 'date');
    if (dateHeader && numericHeaders.length > 0) {
        recommendations.push({
            type: 'line',
            title: '時間趨勢 (Line)',
            description: `分析 ${numericHeaders[0]} 隨時間的變化`,
            columns: { x: dateHeader, y: numericHeaders[0] },
            priority: 3
        });
    }

    // R4: Pie for Distribution
    if (textHeaders.length > 0) {
         const goodCat = textHeaders.find(h => (stats[h]?.uniqueValues || 100) < 10) || textHeaders[0];
         recommendations.push({
             type: 'pie',
             title: '分佈情況 (Pie)',
             description: `${goodCat} 的佔比分佈`,
             columns: { x: goodCat, y: null }, // Count aggregation implied
             priority: 4
         });
    }

    // 5. Generate Insights (Traditional Chinese)
    const insights: string[] = [];
    if (data.length > 1000) insights.push(`偵測到大型資料集（${data.length} 列）。適合進行可靠的統計建模。`);
    if (data.length < 10) insights.push(`資料集較小（${data.length} 列）。建議添加更多資料以獲得更準確的分析。`);
    
    if (correlations.length > 0 && Math.abs(correlations[0].correlation) > 0.7) {
        const c = correlations[0];
        insights.push(`在 ${c.column1} 和 ${c.column2} 之間發現強${c.correlation > 0 ? '正' : '負'}相關（係數：${c.correlation}）。`);
    }
    
    if (numericHeaders.length > 0) {
        const h = numericHeaders[0];
        const s = stats[h];
        if (s && s.stdDev && s.mean) {
            const cv = s.stdDev / s.mean;
            if (cv > 1) insights.push(`${h} 具有高變異（變異係數 > 1），表明資料點分佈較為分散。`);
        }
    }

    if(insights.length === 0) insights.push("資料載入成功。請使用圖表工具探索更多模式。");

    return {
        rows: data.length,
        columns: headers.length,
        columnTypes,
        typeCounts,
        stats,
        correlations,
        recommendations,
        insights
    };
};