import { UseInterceptors } from '@nestjs/common';
import { ABACUnifiedInterceptor } from './abac-unified.interceptor';

export const UseABAC = () => UseInterceptors(ABACUnifiedInterceptor);
