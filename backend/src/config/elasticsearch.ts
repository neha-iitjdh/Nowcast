import { Client } from '@elastic/elasticsearch';
import { config } from './index.js';

let esClient: Client | null = null;

export function getElasticsearch(): Client {
  if (!esClient) {
    esClient = new Client({
      node: config.elasticsearch.url,
      requestTimeout: 30000,
      sniffOnStart: false,
    });
  }
  return esClient;
}

export async function initializeElasticsearch(): Promise<void> {
  const client = getElasticsearch();

  try {
    await client.ping();
    console.log('Connected to Elasticsearch');

    // Create posts index if it doesn't exist
    const postsIndexExists = await client.indices.exists({ index: 'posts' });

    if (!postsIndexExists) {
      await client.indices.create({
        index: 'posts',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                hashtag_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              text: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              hashtags: {
                type: 'keyword',
                normalizer: 'lowercase'
              },
              authorId: { type: 'keyword' },
              authorUsername: { type: 'keyword' },
              authorName: { type: 'text' },
              parentId: { type: 'keyword' },
              likesCount: { type: 'integer' },
              repliesCount: { type: 'integer' },
              repostsCount: { type: 'integer' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
      console.log('Created posts index');
    }

    // Create users index for suggestions
    const usersIndexExists = await client.indices.exists({ index: 'users' });

    if (!usersIndexExists) {
      await client.indices.create({
        index: 'users',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              username: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: {
                    type: 'completion',
                  },
                },
              },
              bio: { type: 'text' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      console.log('Created users index');
    }
  } catch (error) {
    console.error('Elasticsearch initialization error:', error);
    // Don't throw - allow app to work without ES in Phase 1
  }
}

export async function closeElasticsearch(): Promise<void> {
  if (esClient) {
    await esClient.close();
    esClient = null;
  }
}

export default { getElasticsearch, initializeElasticsearch, closeElasticsearch };
