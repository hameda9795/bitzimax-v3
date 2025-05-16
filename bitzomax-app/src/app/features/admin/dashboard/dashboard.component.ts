import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';

import { VideoService } from '../../../core/services/video.service';
import { UserService } from '../../../core/services/user.service';
import { Video } from '../../../shared/models/video.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule]
})
export class DashboardComponent implements OnInit {
  // Analytics Data
  totalViews = 0;
  totalLikes = 0;
  totalVideos = 0;
  totalUsers = 0;
  premiumCount = 0;
  premiumPercentage = 0;
  
  // Revenue stats
  monthlyRevenue = 0;
  lastMonthRevenue = 0;
  revenueChange = 0;
  
  // Top content
  topVideos: Video[] = [];
  recentVideos: Video[] = [];
  
  // Chart data
  public viewsChartType: ChartType = 'line';
  public viewsChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Views',
        backgroundColor: 'rgba(0, 243, 255, 0.2)',
        borderColor: '#00f3ff',
        pointBackgroundColor: '#00f3ff',
        pointBorderColor: '#000',
        pointHoverBackgroundColor: '#ff00ff',
        pointHoverBorderColor: '#fff',
        fill: 'origin',
      }
    ]
  };
  
  public likesChartType: ChartType = 'line';
  public likesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Likes',
        backgroundColor: 'rgba(255, 0, 255, 0.2)',
        borderColor: '#ff00ff',
        pointBackgroundColor: '#ff00ff',
        pointBorderColor: '#000',
        pointHoverBackgroundColor: '#00f3ff',
        pointHoverBorderColor: '#fff',
        fill: 'origin',
      }
    ]
  };
  
  public userChartType: ChartType = 'doughnut';
  public userChartData: ChartData<'doughnut'> = {
    labels: ['Premium', 'Free'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#ff00ff', '#00f3ff'],
        hoverBackgroundColor: ['#ff33ff', '#33f6ff'],
        hoverBorderColor: ['#fff', '#fff']
      }
    ]
  };
  
  public engagementChartType: ChartType = 'bar';
  public engagementChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Engagement Rate (%)',
        backgroundColor: '#ffff00',
        hoverBackgroundColor: '#ffff33'
      }
    ]
  };
  
  // Chart options
  public lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
      }
    }
  };
  
  public doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: 'white'
        }
      }
    }
  };
  
  public barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
      }
    }
  };
  
  // Time ranges
  selectedTimeRange = '7days';
  timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'year', label: 'This Year' }
  ];

  constructor(
    private videoService: VideoService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // In a real app, you'd fetch this data from APIs
    this.generateMockData();
  }
  
  timeRangeChanged(range: string) {
    this.selectedTimeRange = range;
    this.loadDashboardData();
  }
  
  // Generate mock data for demonstration purposes
  private generateMockData() {
    const days = this.selectedTimeRange === '7days' ? 7 : 
                 this.selectedTimeRange === '30days' ? 30 : 
                 this.selectedTimeRange === '90days' ? 90 : 365;
    
    // Generate dates
    const dates: string[] = [];
    const viewsData: number[] = [];
    const likesData: number[] = [];
    
    const today = new Date();
    let baseViews = Math.floor(Math.random() * 500) + 500;
    let baseLikes = Math.floor(Math.random() * 100) + 50;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate random view counts with some trend
      const dailyViews = Math.round(baseViews + (Math.random() * 200 - 100));
      baseViews = dailyViews;
      viewsData.push(dailyViews);
      
      // Generate random like counts with correlation to views
      const dailyLikes = Math.round(baseLikes + (Math.random() * 40 - 20));
      baseLikes = dailyLikes;
      likesData.push(dailyLikes);
    }
    
    // Update chart data
    this.viewsChartData.labels = dates;
    this.viewsChartData.datasets[0].data = viewsData;
    
    this.likesChartData.labels = dates;
    this.likesChartData.datasets[0].data = likesData;
    
    // Calculate totals
    this.totalViews = viewsData.reduce((sum, current) => sum + current, 0);
    this.totalLikes = likesData.reduce((sum, current) => sum + current, 0);
    this.totalVideos = Math.floor(Math.random() * 50) + 20;
    this.totalUsers = Math.floor(Math.random() * 1000) + 500;
    this.premiumCount = Math.floor(this.totalUsers * (Math.random() * 0.3 + 0.1));
    this.premiumPercentage = Math.round((this.premiumCount / this.totalUsers) * 100);
    
    // Update user chart
    this.userChartData.datasets[0].data = [this.premiumCount, this.totalUsers - this.premiumCount];
    
    // Generate engagement data
    const videoTitles = [
      'Night City Dreams', 'Neon Whispers', 'Digital Prophecy',
      'Chrome Hearts', 'Electric Soul', 'Synthetic Memories',
      'Virtual Eden', 'Cyber Dawn', 'Quantum Echo'
    ];
    
    const engagementRates: number[] = [];
    const selectedTitles: string[] = [];
    
    // Pick random videos
    while (selectedTitles.length < 5) {
      const randomIndex = Math.floor(Math.random() * videoTitles.length);
      if (!selectedTitles.includes(videoTitles[randomIndex])) {
        selectedTitles.push(videoTitles[randomIndex]);
        engagementRates.push(Math.round(Math.random() * 60 + 20));
      }
    }
    
    this.engagementChartData.labels = selectedTitles;
    this.engagementChartData.datasets[0].data = engagementRates;
    
    // Generate mock revenue data
    this.monthlyRevenue = Math.round(this.premiumCount * (Math.random() * 5 + 5));
    this.lastMonthRevenue = Math.round(this.monthlyRevenue * (Math.random() * 0.4 + 0.8));
    this.revenueChange = Math.round(((this.monthlyRevenue - this.lastMonthRevenue) / this.lastMonthRevenue) * 100);
    
    // Generate mock top videos
    this.generateMockTopVideos();
  }
  
  private generateMockTopVideos() {
    const videoTitles = [
      'Night City Dreams', 'Neon Whispers', 'Digital Prophecy',
      'Chrome Hearts', 'Electric Soul', 'Synthetic Memories',
      'Virtual Eden', 'Cyber Dawn', 'Quantum Echo'
    ];
    
    const descriptions = [
      'A journey through the digital landscape of consciousness',
      'Exploring the boundaries between human and machine',
      'When synthetic minds dream of electric reality',
      'The rhythm of artificial hearts in a neon-lit world',
      'Memories encoded in the fabric of cyberspace'
    ];
    
    this.topVideos = [];
    for (let i = 0; i < 5; i++) {
      const randomViews = Math.floor(Math.random() * 5000) + 1000;
      const randomLikes = Math.floor(randomViews * (Math.random() * 0.2 + 0.1));
      
      this.topVideos.push({
        id: 'video-' + i,
        title: videoTitles[Math.floor(Math.random() * videoTitles.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        thumbnailUrl: `https://via.placeholder.com/320x180/1A1A1A/00F3FF?text=CYBER+VIDEO+${i+1}`,
        videoUrl: '#',
        duration: Math.floor(Math.random() * 300) + 60,
        views: randomViews,
        likes: randomLikes,
        isPremium: Math.random() > 0.7,
        uploadDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        tags: ['cyberpunk', 'future', 'neon'],
        isVisible: true,
        commentCount: Math.floor(randomLikes * 0.8),
        shareCount: Math.floor(randomLikes * 0.5)
      });
    }
    
    // Recent videos
    this.recentVideos = [...this.topVideos]
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }
  
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
