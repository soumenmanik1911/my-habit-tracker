'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { useTheme } from './theme-provider';
import { FadeIn, ScaleIn } from './animations';
import { cn } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface BaseChartProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

function BaseChart({ title, className, children, delay = 0 }: BaseChartProps) {
  return (
    <FadeIn direction="up" delay={delay}>
      <div className={cn(
        'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden',
        className
      )}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {title}
            </h3>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </FadeIn>
  );
}

interface AnimatedLineChartProps {
  data: any;
  options?: any;
  height?: number;
  delay?: number;
  className?: string;
}

export function AnimatedLineChart({ 
  data, 
  options = {}, 
  height = 300, 
  delay = 0,
  className 
}: AnimatedLineChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef(null);
  const [animatedData, setAnimatedData] = useState(data);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    ...options,
  };

  useEffect(() => {
    // Animate data on mount
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, delay + 500);

    return () => clearTimeout(timer);
  }, [data, delay]);

  return (
    <ScaleIn delay={delay}>
      <div style={{ height }} className="relative">
        <Line
          ref={chartRef}
          data={animatedData}
          options={defaultOptions}
        />
      </div>
    </ScaleIn>
  );
}

interface AnimatedBarChartProps {
  data: any;
  options?: any;
  height?: number;
  delay?: number;
  className?: string;
}

export function AnimatedBarChart({ 
  data, 
  options = {}, 
  height = 300, 
  delay = 0,
  className 
}: AnimatedBarChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef(null);
  const [animatedData, setAnimatedData] = useState(data);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
      },
    },
    animation: {
      delay: (context: any) => {
        return context.type === 'data' && context.mode === 'default' 
          ? context.dataIndex * 100 + context.datasetIndex * 50
          : 0;
      },
      duration: 1000,
    },
    ...options,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, delay + 500);

    return () => clearTimeout(timer);
  }, [data, delay]);

  return (
    <ScaleIn delay={delay}>
      <div style={{ height }} className="relative">
        <Bar
          ref={chartRef}
          data={animatedData}
          options={defaultOptions}
        />
      </div>
    </ScaleIn>
  );
}

interface AnimatedDoughnutChartProps {
  data: any;
  options?: any;
  height?: number;
  delay?: number;
  className?: string;
}

export function AnimatedDoughnutChart({ 
  data, 
  options = {}, 
  height = 300, 
  delay = 0,
  className 
}: AnimatedDoughnutChartProps) {
  const { theme } = useTheme();
  const [animatedData, setAnimatedData] = useState(data);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 2000,
    },
    ...options,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, delay + 500);

    return () => clearTimeout(timer);
  }, [data, delay]);

  return (
    <ScaleIn delay={delay}>
      <div style={{ height }} className="relative">
        <Doughnut data={animatedData} options={defaultOptions} />
      </div>
    </ScaleIn>
  );
}

// Export base chart wrapper
export { BaseChart };