import OpenAI from 'openai';
import { type AIReportSummary, type ReportRequest, type Client } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 4096;

// =============================================================================
// GENERATE REPORT SUMMARY
// =============================================================================

export async function generateReportSummary(
  reportRequest: ReportRequest,
  client: Client,
  rawData?: Record<string, unknown>
): Promise<AIReportSummary> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. Returning mock summary.');
    return generateMockSummary(reportRequest, client);
  }

  const systemPrompt = `You are an expert SEO analyst and report writer for a digital marketing agency. 
Your task is to analyze SEO data and generate a comprehensive, professional report summary.
Always respond with valid JSON matching the exact schema provided.
Be specific, data-driven, and actionable in your recommendations.`;

  const userPrompt = `Generate a comprehensive SEO report summary for the following:

**Client:** ${client.name}
**Website:** ${client.website || 'Not provided'}
**Report Type:** ${reportRequest.report_type.replace(/_/g, ' ').toUpperCase()}
**Period:** ${reportRequest.date_range_start || 'N/A'} to ${reportRequest.date_range_end || 'N/A'}
**Target Keywords:** ${(reportRequest.keywords || []).join(', ') || 'Not specified'}

**Work Done This Period:**
${reportRequest.work_done_notes || 'No notes provided'}

**Raw SEO Data:**
${rawData ? JSON.stringify(rawData, null, 2) : 'No automated data available'}

**Custom Instructions:**
${reportRequest.custom_instructions || 'Generate a standard SEO performance report'}

Please generate a detailed report summary with the following structure:
{
  "executiveSummary": "2-3 paragraph executive summary highlighting key performance metrics, achievements, and areas for improvement",
  "keyInsights": [
    {
      "title": "Insight title",
      "description": "Detailed description with specific metrics",
      "impact": "positive|negative|neutral",
      "metric": "Optional specific metric value"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed actionable recommendation",
      "priority": "high|medium|low",
      "category": "technical|content|links|local|performance"
    }
  ],
  "metricsSnapshot": {
    "organicTraffic": number_or_null,
    "trafficChange": percentage_as_decimal_or_null,
    "keywordsRanking": number_or_null,
    "avgPosition": number_or_null,
    "backlinks": number_or_null,
    "domainAuthority": number_or_null
  }
}

Ensure you provide at least 4 key insights and 5 recommendations. Be specific and actionable.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const parsed = JSON.parse(content) as AIReportSummary;
    return parsed;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockSummary(reportRequest, client);
  }
}

// =============================================================================
// ANALYZE SEO DATA
// =============================================================================

export async function analyzeSEOData(
  data: Record<string, unknown>,
  context: string
): Promise<{ analysis: string; recommendations: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      analysis: 'SEO data analysis complete. Multiple opportunities identified for improvement.',
      recommendations: [
        'Optimize page load speed for mobile devices',
        'Improve internal linking structure',
        'Create more long-form content targeting primary keywords',
      ],
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an SEO data analyst. Analyze the provided data and return insights in JSON format.',
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nData to analyze: ${JSON.stringify(data, null, 2)}\n\nReturn JSON with keys: "analysis" (string) and "recommendations" (array of strings)`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return content ? JSON.parse(content) : { analysis: '', recommendations: [] };
  } catch (error) {
    console.error('SEO analysis error:', error);
    return { analysis: 'Analysis unavailable', recommendations: [] };
  }
}

// =============================================================================
// CREATE CLIENT INSIGHTS
// =============================================================================

export async function createClientInsights(
  client: Client,
  historicalData: unknown[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `Based on ${historicalData.length} historical reports, ${client.name} shows consistent growth in organic search visibility with opportunities in technical optimization and content expansion.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            'You are an SEO strategist. Create actionable insights for a client based on their historical performance data.',
        },
        {
          role: 'user',
          content: `Client: ${client.name} (${client.website})\nIndustry: ${client.industry || 'Unknown'}\nHistorical reports: ${historicalData.length}\n\nGenerate 3-5 sentences of strategic insights for this client.`,
        },
      ],
    });

    return response.choices[0]?.message?.content || 'Insights unavailable';
  } catch (error) {
    console.error('Client insights error:', error);
    return 'Unable to generate insights at this time.';
  }
}

// =============================================================================
// MOCK DATA (for development without OpenAI)
// =============================================================================

function generateMockSummary(reportRequest: ReportRequest, client: Client): AIReportSummary {
  return {
    executiveSummary: `This ${reportRequest.report_type.replace(/_/g, ' ')} report for ${client.name} covers the period from ${reportRequest.date_range_start || 'start'} to ${reportRequest.date_range_end || 'end'}. 

During this period, the website demonstrated strong performance in organic search with notable improvements across key ranking metrics. The SEO strategy implemented has yielded measurable results, with particular success in targeting commercial intent keywords.

Overall, the website is well-positioned for continued growth. The recommendations outlined in this report will help maintain momentum and address remaining technical and content opportunities to further strengthen the site's search visibility.`,
    keyInsights: [
      {
        title: 'Organic Traffic Growth',
        description:
          'Organic search traffic increased significantly compared to the previous period, driven by improved rankings for target keywords and successful content optimization efforts.',
        impact: 'positive',
        metric: '+23.4%',
      },
      {
        title: 'Keyword Ranking Improvements',
        description:
          'Multiple target keywords moved into top 10 positions, with 15 keywords now ranking on page 1. High-value commercial keywords show the most improvement.',
        impact: 'positive',
        metric: '47 keywords in top 10',
      },
      {
        title: 'Technical Issues Identified',
        description:
          'Crawl analysis revealed several technical issues including slow page load times on mobile devices and some duplicate content concerns that need addressing.',
        impact: 'negative',
        metric: '12 issues found',
      },
      {
        title: 'Backlink Profile Strengthening',
        description:
          'The domain acquired quality backlinks from relevant industry publications this period, contributing to improved domain authority.',
        impact: 'positive',
        metric: '18 new referring domains',
      },
      {
        title: 'Content Gap Opportunities',
        description:
          'Analysis reveals significant untapped keyword opportunities in the mid-funnel content area. Competitors are capturing traffic for terms where the site has no content.',
        impact: 'neutral',
        metric: '34 gap keywords identified',
      },
    ],
    recommendations: [
      {
        title: 'Optimize Core Web Vitals',
        description:
          'Address page speed issues, particularly on mobile devices. Focus on image compression, lazy loading, and reducing render-blocking JavaScript to improve LCP and FID scores.',
        priority: 'high',
        category: 'technical',
      },
      {
        title: 'Create Mid-Funnel Content',
        description:
          'Develop 8-10 pieces of comparison and how-to content targeting the identified keyword gaps. Focus on buyer intent keywords with search volumes between 500-2000/month.',
        priority: 'high',
        category: 'content',
      },
      {
        title: 'Build Internal Linking Structure',
        description:
          'Audit and improve internal links to better distribute page authority. Create a hub-and-spoke model connecting main service pages to supporting blog content.',
        priority: 'medium',
        category: 'technical',
      },
      {
        title: 'Expand Link Building Campaign',
        description:
          'Continue digital PR and link building outreach. Target industry publications and resource pages in the niche to further strengthen domain authority.',
        priority: 'medium',
        category: 'links',
      },
      {
        title: 'Optimize Existing Top Pages',
        description:
          'Update and expand content on the top 5 organic landing pages. Add FAQ sections, update statistics, and improve keyword coverage to defend current rankings.',
        priority: 'medium',
        category: 'content',
      },
      {
        title: 'Fix Duplicate Content Issues',
        description:
          'Implement canonical tags on paginated pages and parameter-based URLs to resolve duplicate content issues flagged in the technical audit.',
        priority: 'low',
        category: 'technical',
      },
    ],
    metricsSnapshot: {
      organicTraffic: 8432,
      trafficChange: 0.234,
      keywordsRanking: 247,
      avgPosition: 14.3,
      backlinks: 1847,
      domainAuthority: 42,
    },
  };
}
