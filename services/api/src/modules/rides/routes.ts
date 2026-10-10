import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  rideDetailSchema,
  rideListQuerySchema,
  rideListResponseSchema,
  rideSummarySchema,
} from '@ridesphere/shared';

import { optionalUser } from '../../auth/optional-user';
import { AppError, errorResponse, validationHook } from '../../common/errors';
import type { AppBindings } from '../../common/types';
import { getRide, listRides } from './service';

// Rebuilt from the shared shapes with this package's OpenAPI-aware zod.
const RideSummarySchema = z.object(rideSummarySchema.shape).openapi('RideSummary');
const RideListSchema = z
  .object({ ...rideListResponseSchema.shape, items: z.array(RideSummarySchema) })
  .openapi('RideList');
const RideDetailSchema = z.object(rideDetailSchema.shape).openapi('RideDetail');
const RideListQuerySchema = z.strictObject(rideListQuerySchema.shape);

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Rides'],
  summary: 'Upcoming rides, soonest first',
  description:
    'Visitors see public rides. Signed-in members also see members-only rides. Private rides are never listed.',
  request: { query: RideListQuerySchema },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: RideListSchema } } },
    400: errorResponse('A filter or the cursor is not valid'),
  },
});

const detailRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Rides'],
  summary: 'One ride',
  description:
    'Exact meeting instructions are included only when the viewer is allowed to see them. Route and difficulty information is supplied by the organiser and is not a guarantee of safety.',
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: RideDetailSchema } } },
    400: errorResponse('The ride ID is not valid'),
    404: errorResponse('No such ride, or it is not visible to you'),
  },
});

export const rideRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
rideRoutes.use(optionalUser);

rideRoutes.openapi(listRoute, async (c) =>
  c.json(await listRides(c.get('db'), c.req.valid('query'), c.get('viewer')), 200),
);

rideRoutes.openapi(detailRoute, async (c) => {
  const ride = await getRide(c.get('db'), c.req.valid('param').id, c.get('viewer'));
  if (!ride) throw new AppError(404, 'NOT_FOUND', 'That ride could not be found.');
  return c.json(ride, 200);
});
