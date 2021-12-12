import { ArgumentMetadata, HttpException, HttpStatus, Injectable, PipeTransform, Type } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export default class ValidationPipe implements PipeTransform<any>{
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const error = await validate(object);
    if (error.length > 0) {
      const { constraints } = error[0];
      const errMessage = Object.values(constraints)[0];
      throw new HttpException({ message: errMessage }, HttpStatus.BAD_REQUEST);
    }

    return value;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find(type => metatype === type);
  }
}