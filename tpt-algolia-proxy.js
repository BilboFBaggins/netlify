// Curated education keywords that actually exist in TPT
const educationKeywordsByCategory = {
  all: [
    'essay', 'test prep', 'grammar', 'vocabulary', 'writing', 'reading comprehension',
    'AP exam', 'SAT practice', 'ACT prep', 'IB exam', 'college essay',
    'poetry', 'novel study', 'short story', 'drama', 'literature',
    'character analysis', 'theme analysis', 'literary analysis', 'symbolism', 'literary devices',
    'persuasive writing', 'argumentative essay', 'narrative writing', 'expository', 'descriptive',
    'grammar worksheet', 'punctuation', 'sentence structure', 'parts of speech', 'verb tense',
    'interview', 'feature story', 'news writing', 'opinion writing', 'journalism',
    'AP style', 'media literacy', 'presentation', 'public speaking', 'debate',
    'social studies', 'history', 'government', 'economics', 'psychology',
    'STEM', 'science', 'math', 'problem solving', 'critical thinking',
    'classroom management', 'lesson plan', 'rubric', 'assessment', 'formative assessment',
    'differentiation', 'ELL', 'special education', 'gifted', 'intervention',
    'engagement', 'motivation', 'culture', 'diversity', 'social emotional',
    'project based learning', 'inquiry', 'Socratic method', 'discussion', 'Bloom\'s taxonomy',
    'close reading', 'annotation', 'text evidence', 'thesis statement', 'outline',
    'comma rules', 'semicolon', 'apostrophe', 'capitalization', 'spelling',
    'Romeo and Juliet', 'Macbeth', 'Hamlet', 'Great Gatsby', 'To Kill a Mockingbird',
    'Of Mice and Men', 'Lord of the Flies', 'Hunger Games', '1984', 'Animal Farm',
    'poetry analysis', 'haiku', 'sonnet', 'rhyme scheme', 'meter',
    'persuasion', 'rhetoric', 'ethos pathos logos', 'propaganda', 'bias',
    'research', 'MLA format', 'citation', 'works cited', 'source evaluation',
    'phonics', 'sight words', 'fluency', 'comprehension strategy', 'vocabulary strategy',
    'benchmark', 'SBAC', 'STAAR', 'SOL', 'common core',
    'distance learning', 'Google Classroom', 'digital', 'remote', 'hybrid'
  ],
  ap: [
    'AP exam', 'AP practice', 'AP review', 'AP multiple choice', 'AP free response',
    'AP literature', 'AP language', 'AP US history', 'AP world history', 'AP European history',
    'AP biology', 'AP chemistry', 'AP physics', 'AP calculus', 'AP statistics',
    'AP psychology', 'AP economics', 'AP government', 'AP seminar', 'AP research',
    'AP essay', 'AP test prep', 'AP study guide', 'AP practice test', 'AP exam prep'
  ],
  ib: [
    'IB exam', 'IB practice', 'IB revision', 'IB study guide', 'IB test prep',
    'IB English', 'IB history', 'IB economics', 'IB biology', 'IB chemistry',
    'IB physics', 'IB mathematics', 'IB psychology', 'IB theory of knowledge',
    'IB extended essay', 'IB internal assessment', 'IB IA', 'IB past paper'
  ],
  writing: [
    'essay', 'essay outline', 'essay rubric', 'essay prompt', 'essay structure',
    'argumentative essay', 'persuasive essay', 'narrative essay', 'expository essay', 'analytical essay',
    'thesis statement', 'topic sentence', 'transition words', 'evidence analysis', 'paragraph',
    'introduction', 'conclusion', 'body paragraph', 'outline', 'brainstorm',
    'revision', 'editing', 'grammar', 'punctuation', 'sentence variety'
  ],
  literature: [
    'novel study', 'short story', 'poetry', 'drama', 'literary analysis',
    'character analysis', 'theme analysis', 'symbolism', 'literary devices', 'figurative language',
    'Romeo and Juliet', 'Macbeth', 'Hamlet', 'Great Gatsby', 'To Kill a Mockingbird',
    'Of Mice and Men', 'Lord of the Flies', '1984', 'Animal Farm', 'Hunger Games',
    'irony', 'foreshadowing', 'flashback', 'point of view', 'tone and mood'
  ],
  journalism: [
    'journalism', 'interview', 'feature story', 'news writing', 'opinion writing',
    'sports writing', 'AP style', 'press release', 'news lead', 'inverted pyramid',
    'journalism rubric', 'interview questions', 'fact checking', 'media literacy', 'bias'
  ],
  testprep: [
    'test prep', 'SAT prep', 'SAT practice', 'SAT reading', 'SAT writing', 'SAT math',
    'ACT prep', 'ACT practice', 'ACT English', 'ACT reading', 'ACT science',
    'college essay', 'college readiness', 'standardized test', 'exam prep', 'practice test'
  ]
};

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, keyword, category = 'all', limit = 50 } = body;

    // Handle category-based discovery
    if (action === 'getIndexedKeywords') {
      const keywordList = educationKeywordsByCategory[category] || educationKeywordsByCategory.all;
      const selectedKeywords = keywordList.slice(0, Math.min(limit, keywordList.length));

      // Batch query these keywords
      const results = [];
      for (const kw of selectedKeywords) {
        try {
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
                    params: `query=${encodeURIComponent(kw)}&hitsPerPage=1`,
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0] && data.results[0].hits && data.results[0].hits.length > 0) {
              const hit = data.results[0].hits[0];
              const supply = hit.Resources?.exact_nb_hits;
              const popularity = hit.popularity || 1;
              const hasSupply = supply != null;

              const supplyDisplay = hasSupply ? supply : 'n/a';
              const gaScore = hasSupply ? (supply / popularity).toFixed(2) : 'n/a';
              const demandPer1k = hasSupply && supply > 0 ? ((popularity / supply) * 1000).toFixed(0) : 'n/a';
              const difficulty = hasSupply ? Math.log(supply).toFixed(2) : 'n/a';

              results.push({
                keyword: kw,
                popularity,
                supply: supplyDisplay,
                difficulty,
                gaScore,
                demandPer1k,
              });
            }
          }
        } catch (err) {
          console.error(`Error querying ${kw}:`, err);
        }
      }

      // Sort by GA Score (ascending = best opportunities)
      results.sort((a, b) => {
        const scoreA = parseFloat(a.gaScore) || Infinity;
        const scoreB = parseFloat(b.gaScore) || Infinity;
        return scoreA - scoreB;
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: results,
          category,
          count: results.length,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Handle keyword search (existing logic)
    const { keyword } = body;
    
    if (!keyword || keyword.trim() === '') {
      return {
        statusCode: 400,
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
      },
      body: JSON.stringify({
        hits: processed,
        seedTerm: keyword,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
