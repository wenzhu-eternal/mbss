import type { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestService {
  constructor(private readonly httpService: HttpService) {}

  async getRequest(url: string, config?: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.get(url, config).subscribe({
        next: (res) => resolve(res.data),
        error: (error) => reject(error),
      });
    });
  }

  async postRequest(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.post(url, data, config).subscribe({
        next: (res) => resolve(res.data),
        error: (error) => reject(error),
      });
    });
  }
}
