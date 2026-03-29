import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as xss from 'xss';

const xssFilter = xss as any;

const DEFAULT_METADATA: ArgumentMetadata = {
  type: 'body',
  metatype: undefined,
  data: '',
};

@Injectable()
export default class SanitizePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (!value) {
      return value;
    }

    if (typeof value === 'string') {
      return xssFilter(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeObject(obj: object): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.transform(item, DEFAULT_METADATA));
    }

    const sanitized: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    for (const key in objRecord) {
      if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
        sanitized[key] = this.transform(objRecord[key], DEFAULT_METADATA);
      }
    }

    return sanitized;
  }
}
