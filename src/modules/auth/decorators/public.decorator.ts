import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Mark a route as unauthenticated even when JwtAuthGuard is configured globally.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
