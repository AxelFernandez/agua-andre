import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zona } from '../entities/zona.entity';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(Zona)
    private zonasRepository: Repository<Zona>,
  ) {}

  async findAll(): Promise<Zona[]> {
    return this.zonasRepository.find({
      relations: ['usuarios'],
    });
  }

  async findOne(id: number): Promise<Zona> {
    const zona = await this.zonasRepository.findOne({
      where: { id },
      relations: ['usuarios'],
    });
    
    if (!zona) {
      throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    }
    
    return zona;
  }

  async create(zonaData: Partial<Zona>): Promise<Zona> {
    const zona = this.zonasRepository.create(zonaData);
    return this.zonasRepository.save(zona);
  }

  async update(id: number, zonaData: Partial<Zona>): Promise<Zona> {
    const zona = await this.findOne(id);
    Object.assign(zona, zonaData);
    return this.zonasRepository.save(zona);
  }

  async delete(id: number): Promise<void> {
    const zona = await this.findOne(id);
    await this.zonasRepository.remove(zona);
  }
}

