const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Keyword lists by category
const educationKeywordsByCategory = {
  ap: ['AP English', 'AP Language', 'AP Literature', 'AP Seminar', 'AP Research', 'AP essay', 'AP rhetoric', 'AP argumentation', 'AP synthesis essay', 'AP free response', 'AP rhetorical analysis', 'AP multiple choice', 'AP exam prep', 'AP practice', 'AP study guide', 'AP review', 'AP nonfiction', 'AP fiction analysis', 'AP poetry', 'AP drama', 'AP writing', 'AP reading', 'AP comprehension', 'AP test prep'],
  ib: ['IB English', 'IB Language', 'IB Literature', 'IB Paper 1', 'IB Paper 2', 'IB HL', 'IB SL', 'IB essay', 'IB exam', 'IB study guide', 'IB practice', 'IB preparation', 'IB review', 'IB assessment', 'IB written task', 'IB interactive oral', 'IB commentary', 'IB analysis', 'IB writing', 'IB reading comprehension'],
  writing: ['essay writing', 'persuasive essay', 'expository essay', 'narrative essay', 'argumentative essay', 'compare and contrast', 'five paragraph essay', 'creative writing', 'descriptive writing', 'paragraph writing', 'essay structure', 'thesis statement', 'topic sentence', 'essay outline', 'body paragraphs', 'conclusion writing', 'introduction writing', 'essay rubric', 'writing process', 'revision', 'editing', 'proofreading'],
  literature: ['novel study', 'short story', 'poetry analysis', 'drama', 'Shakespeare', 'To Kill a Mockingbird', 'The Great Gatsby', 'Of Mice and Men', 'Romeo and Juliet', 'Macbeth', 'Hamlet', 'A Doll House', 'character analysis', 'theme analysis', 'symbolism', 'figurative language', 'literary devices', 'plot analysis', 'setting', 'point of view', 'literary analysis', 'book club', 'reading comprehension'],
  journalism: ['journalism', 'news writing', 'feature writing', 'opinion writing', 'journalism basics', 'newsroom', 'newspaper', 'reporting', 'interviewing skills', 'media literacy', 'fact checking', 'journalistic writing', 'news article', 'journalism assignment', 'journalism unit', 'journalism curriculum', 'student journalism', 'yearbook', 'literary magazine', 'publication', 'journalism ethics'],
  testprep: ['test prep', 'SAT prep', 'ACT prep', 'reading comprehension', 'grammar review', 'vocabulary', 'test strategy', 'test taking skills', 'practice test', 'exam preparation', 'reading test', 'writing test', 'multiple choice', 'standardized test', 'test review', 'benchmark test', 'assessment prep'],
  all: ['essay', 'writing', 'reading', 'literature', 'vocabulary', 'grammar', 'speaking', 'listening', 'comprehension', 'analysis', 'test prep', 'AP', 'IB', 'journalism', 'news writing', 'creative writing', 'expository', 'persuasive', 'narrative', 'research', 'citation', 'MLA', 'APA', 'Chicago style', 'debate', 'discussion', 'Socratic seminar', 'critical thinking', 'annotate', 'close reading', 'inference', 'summary', 'paraphrase', 'argument', 'evidence', 'counterargument', 'rhetoric', 'persuasion', 'revision', 'editing', 'proofreading', 'publication', 'novel', 'short story', 'poetry', 'drama', 'nonfiction', 'character', 'theme', 'plot', 'setting', 'symbolism']
};

exports.handler = async (event, context) => {
  console.log('=== REQUEST START ===');
  console.log('Method:', event.httpMethod);
  console.log('Body:', event.body);
  
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('Non-POST request rejected');
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'POST only' })
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON: ' + parseError.message })
      };
    }

    const { action, keyword, category, limit } = body;
    console.log('Action:', action);
    console.log('Keyword:', keyword);
    console.log('Category:', category);
    console.log('Limit:', limit);

    // Handle keyword search (backward compatible)
    if (!action || action === 'search') {
      console.log('Processing search action');
      if (!keyword) {
        console.log('No keyword provided');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Keyword required' })
        };
      }

      console.log('Calling TPT API...');
      const response = await fetch('https://SBEKGJSJ8M-dsn.algolia.net/1/indexes/*/queries', {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': 'SBEKGJSJ8M',
          'X-Algolia-API-Key': 'ce17b545c6ba0432cf638e0c29ee64ef',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            indexName: 'Resource Suggestions',
            params: `query=${keyword}&hitsPerPage=20`,
          }],
        }),
      });

      console.log('TPT API response status:', response.status);
      if (!response.ok) throw new Error(`TPT API ${response.status}`);
      const data = await response.json();

      if (!data.results?.[0]?.hits) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          body: JSON.stringify({ hits: [] })
        };
      }

      const hits = data.results[0].hits.map((hit) => {
        const supply = hit.Resources?.exact_nb_hits;
        const popularity = hit.popularity || 1;
        const gaScore = supply ? (supply / popularity).toFixed(2) : 'n/a';
        return {
          keyword: hit.query,
          popularity,
          supply: supply || 'n/a',
          difficulty: supply ? Math.log(supply).toFixed(2) : 'n/a',
          gaScore,
          demandPer1k: supply > 0 ? ((popularity / supply) * 1000).toFixed(0) : 'n/a',
        };
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ hits })
      };
    }

    // Handle category discovery
    if (action === 'getIndexedKeywords') {
      console.log('Processing getIndexedKeywords action');
      console.log('Category exists?', category in educationKeywordsByCategory);
      
      if (!category || !educationKeywordsByCategory[category]) {
        console.log('Invalid category:', category);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid category: ' + category })
        };
      }

      const keywords = educationKeywordsByCategory[category];
      const limitNum = Math.min(limit || 100, keywords.length);
      const keywordsToFetch = keywords.slice(0, limitNum);

      console.log('Fetching', keywordsToFetch.length, 'keywords');

      const requests = keywordsToFetch.map((kw) => ({
        indexName: 'Resource Suggestions',
        params: `query=${encodeURIComponent(kw)}&hitsPerPage=1`,
      }));

      console.log('Calling batch API with', requests.length, 'requests');
      const batchResponse = await fetch('https://SBEKGJSJ8M-dsn.algolia.net/1/indexes/*/queries', {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': 'SBEKGJSJ8M',
          'X-Algolia-API-Key': 'ce17b545c6ba0432cf638e0c29ee64ef',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      console.log('Batch response status:', batchResponse.status);
      if (!batchResponse.ok) throw new Error(`Batch failed ${batchResponse.status}`);
      const batchData = await batchResponse.json();

      if (!batchData.results) {
        console.log('No results in batch response');
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          body: JSON.stringify({ keywords: [] })
        };
      }

      const processedKeywords = batchData.results
        .map((result) => {
          if (!result.hits?.length) return null;
          const hit = result.hits[0];
          const supply = hit.Resources?.exact_nb_hits;
          const popularity = hit.popularity || 1;
          const gaScore = supply ? (supply / popularity).toFixed(2) : 'n/a';
          return {
            keyword: hit.query,
            popularity: parseInt(popularity) || 0,
            supply: supply || 'n/a',
            difficulty: supply ? Math.log(supply).toFixed(2) : 'n/a',
            gaScore: parseFloat(gaScore),
            demandPer1k: supply > 0 ? ((popularity / supply) * 1000).toFixed(0) : 'n/a',
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const aScore = typeof a.gaScore === 'number' ? a.gaScore : Infinity;
          const bScore = typeof b.gaScore === 'number' ? b.gaScore : Infinity;
          return aScore - bScore;
        });

      console.log('Returning', processedKeywords.length, 'processed keywords');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({
          keywords: processedKeywords,
          category,
          count: processedKeywords.length,
          timestamp: new Date().toISOString(),
        })
      };
    }

    console.log('Unknown action:', action);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unknown action: ' + action })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
// Updated: May 20, 2026
