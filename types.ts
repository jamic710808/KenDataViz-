export interface DataRow {
    [key: string]: string | number | boolean | null;
}

export interface ColumnStats {
    count: number;
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    range?: number;
    stdDev?: number;
    uniqueValues?: number;
    mostFrequent?: string | number;
    mostFrequentCount?: number;
    mostFrequentPercentage?: number;
}

export interface CorrelationPair {
    column1: string;
    column2: string;
    correlation: number;
}

export interface ChartRecommendation {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'area';
    title: string;
    description: string;
    columns: {
        x: string;
        y: string | null;
    };
    priority: number;
}

export interface AnalysisResult {
    rows: number;
    columns: number;
    columnTypes: Record<string, string>;
    typeCounts: Record<string, number>;
    stats: Record<string, ColumnStats>;
    correlations: CorrelationPair[];
    recommendations: ChartRecommendation[];
    insights: string[];
}

export interface NotificationState {
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface FilterCondition {
    id: string;
    column: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'range';
    value: string;
    value2?: string; // For range end
}