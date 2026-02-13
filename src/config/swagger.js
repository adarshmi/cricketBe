module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Live Cricket Score API',
    version: '1.0.0',
    description: 'REST API for live cricket score: matches, balls, scoreboard (derived from balls), players. Base URL: `/api`.',
  },
  servers: [{ url: '/api', description: 'API base' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Umpire login token' },
    },
  },
  tags: [
    { name: 'Auth', description: 'Umpire register and login' },
    { name: 'Matches', description: 'Match CRUD and match-scoped resources' },
    { name: 'Players', description: 'Player reference data' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register umpire',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } },
              },
            },
          },
        },
        responses: { 201: { description: 'User and token' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login umpire',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'User and token' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user (requires auth)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/matches': {
      get: {
        tags: ['Matches'],
        summary: 'List matches',
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'live', 'completed'] }, description: 'Filter by status' }],
        responses: { 200: { description: 'List of matches' } },
      },
      post: {
        tags: ['Matches'],
        summary: 'Create match',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Team A vs Team B' },
                  team_a_id: { type: 'integer', nullable: true },
                  team_b_id: { type: 'integer', nullable: true },
                  venue: { type: 'string', nullable: true },
                  match_date: { type: 'string', format: 'date', nullable: true },
                  status: { type: 'string', enum: ['scheduled', 'live', 'completed'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created match' } },
      },
    },
    '/matches/{id}': {
      get: {
        tags: ['Matches'],
        summary: 'Get match by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Match' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Matches'],
        summary: 'Update match (e.g. status)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { status: { type: 'string', enum: ['scheduled', 'live', 'completed'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated match' }, 404: { description: 'Not found' } },
      },
    },
    '/matches/{matchId}/players': {
      get: {
        tags: ['Matches'],
        summary: 'Get match squad',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'List of match_player with player names' } },
      },
      post: {
        tags: ['Matches'],
        summary: 'Add player to match',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['playerId', 'teamSide'],
                properties: {
                  playerId: { type: 'integer' },
                  teamSide: { type: 'string', enum: ['A', 'B'] },
                  battingOrder: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Updated squad' } },
      },
    },
    '/matches/{matchId}/scoreboard': {
      get: {
        tags: ['Matches'],
        summary: 'Get scoreboard (derived from balls)',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Scoreboard: innings total, batsmen (runs, balls, fours, sixes, SR), bowlers (overs, runs, wickets)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    matchId: { type: 'integer' },
                    matchName: { type: 'string' },
                    innings: {
                      type: 'object',
                      properties: {
                        totalRuns: { type: 'integer' },
                        totalWickets: { type: 'integer' },
                        totalOvers: { type: 'string' },
                        extras: { type: 'integer' },
                      },
                    },
                    batsmen: { type: 'array', items: { type: 'object' } },
                    bowlers: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          404: { description: 'Match not found' },
        },
      },
    },
    '/matches/{matchId}/balls': {
      get: {
        tags: ['Matches'],
        summary: 'List balls (ball-by-ball)',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'List of ball rows' } },
      },
      post: {
        tags: ['Matches'],
        summary: 'Add one ball (umpire)',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['strikerId', 'nonStrikerId', 'bowlerId'],
                properties: {
                  runsBatter: { type: 'integer', minimum: 0, maximum: 6, default: 0 },
                  runsExtra: { type: 'integer', minimum: 0, default: 0 },
                  extraType: { type: 'string', enum: ['wide', 'no_ball', 'bye', 'leg_bye', 'penalty'], nullable: true },
                  strikerId: { type: 'integer' },
                  nonStrikerId: { type: 'integer' },
                  bowlerId: { type: 'integer' },
                  wicketType: { type: 'string', enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'], nullable: true },
                  dismissedPlayerId: { type: 'integer', nullable: true, description: 'Required when wicketType is set' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Ball and updated scoreboard' }, 400: { description: 'Validation error' } },
      },
    },
    '/matches/{matchId}/balls/undo': {
      post: {
        tags: ['Matches'],
        summary: 'Undo last ball',
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Updated scoreboard' }, 400: { description: 'No ball to undo' } },
      },
    },
    '/players': {
      get: {
        tags: ['Players'],
        summary: 'List players',
        responses: { 200: { description: 'List of players' } },
      },
      post: {
        tags: ['Players'],
        summary: 'Create player',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Created player' } },
      },
    },
    '/players/{id}': {
      get: {
        tags: ['Players'],
        summary: 'Get player by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Player' }, 404: { description: 'Not found' } },
      },
    },
  },
};
