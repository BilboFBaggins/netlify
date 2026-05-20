// Curated keyword lists by education category
// These are common, high-potential keywords for Bilbo's journalism & English niche
const educationKeywordsByCategory = {
  ap: [
    'AP English', 'AP Language', 'AP Literature', 'AP Seminar', 'AP Research',
    'AP essay', 'AP rhetoric', 'AP argumentation', 'AP synthesis essay',
    'AP free response', 'AP rhetorical analysis', 'AP multiple choice',
    'AP exam prep', 'AP practice', 'AP study guide', 'AP review',
    'AP nonfiction', 'AP fiction analysis', 'AP poetry', 'AP drama',
    'AP writing', 'AP reading', 'AP comprehension', 'AP test prep'
  ],
  ib: [
    'IB English', 'IB Language', 'IB Literature', 'IB Paper 1', 'IB Paper 2',
    'IB HL', 'IB SL', 'IB essay', 'IB exam', 'IB study guide',
    'IB practice', 'IB preparation', 'IB review', 'IB assessment',
    'IB written task', 'IB interactive oral', 'IB commentary',
    'IB analysis', 'IB writing', 'IB reading comprehension'
  ],
  writing: [
    'essay writing', 'persuasive essay', 'expository essay', 'narrative essay',
    'argumentative essay', 'compare and contrast', 'five paragraph essay',
    'creative writing', 'descriptive writing', 'paragraph writing',
    'essay structure', 'thesis statement', 'topic sentence', 'essay outline',
    'body paragraphs', 'conclusion writing', 'introduction writing',
    'essay rubric', 'writing process', 'revision', 'editing', 'proofreading'
  ],
  literature: [
    'novel study', 'short story', 'poetry analysis', 'drama', 'Shakespeare',
    'To Kill a Mockingbird', 'The Great Gatsby', 'Of Mice and Men',
    'Romeo and Juliet', 'Macbeth', 'Hamlet', 'A Doll House',
    'character analysis', 'theme analysis', 'symbolism', 'figurative language',
    'literary devices', 'plot analysis', 'setting', 'point of view',
    'literary analysis', 'book club', 'reading comprehension'
  ],
  journalism: [
    'journalism', 'news writing', 'feature writing', 'opinion writing',
    'journalism basics', 'newsroom', 'newspaper', 'reporting',
    'interviewing skills', 'media literacy', 'fact checking',
    'journalistic writing', 'news article', 'journalism assignment',
    'journalism unit', 'journalism curriculum', 'student journalism',
    'yearbook', 'literary magazine', 'publication', 'journalism ethics'
  ],
  testprep: [
    'test prep', 'SAT prep', 'ACT prep', 'reading comprehension',
    'grammar review', 'vocabulary', 'test strategy', 'test taking skills',
    'practice test', 'exam preparation', 'reading test',
    'writing test', 'multiple choice', 'standardized test',
    'test review', 'benchmark test', 'assessment prep'
  ],
  all: [
    'essay', 'writing', 'reading', 'literature', 'vocabulary',
    'grammar', 'speaking', 'listening', 'comprehension', 'analysis',
    'test prep', 'AP', 'IB', 'journalism', 'news writing',
    'creative writing', 'expository', 'persuasive', 'narrative',
    'research', 'citation', 'MLA', 'APA', 'Chicago style',
    'debate', 'discussion', 'Socratic seminar', 'critical thinking',
    'annotate', 'close reading', 'inference', 'summary', 'paraphrase',
    'argument', 'evidence', 'counterargument', 'rhetoric', 'persuasion',
    'revision', 'editing', 'proofreading', 'publication',
    'novel', 'short story', 'poetry', 'drama', 'nonfiction',
    'character', 'theme', 'plot', 'setting', 'symbolism'
  ]
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, keyword, category, limit } = body;

    // ============================================================
    // EXISTING: Handle single keyword search (backward compatible)
    // ============================================================
    if (!action || action === 'search') {
      if (!keyword || keyword.trim() === '') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Keyword required' }),
        };
      }

      const encodedKeyword = encodeURIComponent(keyword).replace(/'/g, '%27');
      
      // Call TPT's Algolia API
      const response = await fetch(
        'https://SBEKGJSJ8M-dsn.algolia.net/1/indexes/*/queries',
        {
          method: 'POST',
          headers: {
            'X-Algolia-Application-Id': 'SBEKGJSJ8M',
            'X-Algolia-API-Key': 'ce17b545c6ba0432cf638e0c29ee64ef',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                indexName: 'Resource Suggestions',
                params: `query=${keyword}&hitsPerPage=20`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TPT API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Extract and process results
      if (!data.results || !data.results[0] || !data.results[0].hits) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ hits: [], message: 'No results found' }),
        };
      }

      const hits = data.results[0].hits;
      
      // Process hits into our format
      const processed = hits.map((hit) => {
        const supply = hit.Resources?.exact_nb_hits;
        const popularity = hit.popularity || 1;
        const hasSupply = supply != null;
        
        const supplyDisplay = hasSupply ? supply : 'n/a';
        const gaScore = hasSupply ? (supply / popularity).toFixed(2) : 'n/a';
        const demandPer1k = hasSupply && supply > 0 ? ((popularity / supply) * 1000).toFixed(0) : 'n/a';
        const difficulty = hasSupply ? Math.log(supply).toFixed(2) : 'n/a';
        
        return {
          keyword: hit.query,
          popularity,
          supply: supplyDisplay,
          difficulty,
          gaScore,
          demandPer1k,
        };
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        body: JSON.stringify({
          hits: processed,
          seedTerm: keyword,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // ============================================================
    // NEW: Handle batch category keyword discovery
    // ============================================================
    if (action === 'getIndexedKeywords') {
      if (!category || !educationKeywordsByCategory[category]) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Valid category required. Options: ap, ib, writing, literature, journalism, testprep, all' 
          }),
        };
      }

      const keywords = educationKeywordsByCategory[category];
      const limitNum = Math.min(limit || 100, keywords.length);
      const keywordsToFetch = keywords.slice(0, limitNum);

      // Build batch request for all keywords at once
      const requests = keywordsToFetch.map((kw) => ({
        indexName: 'Resource Suggestions',
        params: `query=${encodeURIComponent(kw)}&hitsPerPage=1`,
      }));

      // Call TPT's Algolia API with batch request
      const batchResponse = await fetch(
        'https://SBEKGJSJ8M-dsn.algolia.net/1/indexes/*/queries',
        {
          method: 'POST',
          headers: {
            'X-Algolia-Application-Id': 'SBEKGJSJ8M',
            'X-Algolia-API-Key': 'ce17b545c6ba0432cf638e0c29ee64ef',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        }
      );

      if (!batchResponse.ok) {
        throw new Error(`TPT API batch request failed: ${batchResponse.status}`);
      }

      const batchData = await batchResponse.json();

      // Process results
      if (!batchData.results || !Array.isArray(batchData.results)) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ keywords: [], message: 'No results found' }),
        };
      }

      const processedKeywords = batchData.results
        .map((result, index) => {
          if (!result.hits || result.hits.length === 0) {
            return null;
          }

          const hit = result.hits[0];
          const supply = hit.Resources?.exact_nb_hits;
          const popularity = hit.popularity || 1;
          const hasSupply = supply != null;

          const supplyDisplay = hasSupply ? supply : 'n/a';
          const gaScore = hasSupply ? (supply / popularity).toFixed(2) : 'n/a';
          const demandPer1k = hasSupply && supply > 0 ? ((popularity / supply) * 1000).toFixed(0) : 'n/a';
          const difficulty = hasSupply ? Math.log(supply).toFixed(2) : 'n/a';

          return {
            keyword: hit.query,
            popularity: parseInt(popularity) || 0,
            supply: supplyDisplay,
            difficulty,
            gaScore: parseFloat(gaScore),
            demandPer1k,
          };
        })
        .filter((item) => item !== null)
        // Sort by GA Score ascending (lower = better opportunity)
        .sort((a, b) => {
          const aScore = typeof a.gaScore === 'number' ? a.gaScore : Infinity;
          const bScore = typeof b.gaScore === 'number' ? b.gaScore : Infinity;
          return aScore - bScore;
        });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        body: JSON.stringify({
          keywords: processedKeywords,
          category,
          count: processedKeywords.length,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Unknown action
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unknown action. Use "search" or "getIndexedKeywords"' }),
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
