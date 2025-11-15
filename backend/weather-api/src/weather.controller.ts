import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get()
  @ApiQuery({ name: 'city', required: true })
  @ApiQuery({ name: 'units', required: false, description: 'metric or imperial' })
  async get(@Query('city') city: string, @Query('units') units?: string) {
    return this.weather.getWeather(city, units || 'metric');
  }

  @Get('forecast')
  @ApiQuery({ name: 'city', required: true })
  @ApiQuery({ name: 'units', required: false, description: 'metric or imperial' })
  async getForecast(@Query('city') city: string, @Query('units') units?: string) {
    return this.weather.getForecast(city, units || 'metric');
  }
}

