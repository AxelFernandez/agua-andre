import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class LecturasService {
  constructor(
    @InjectRepository(Lectura)
    private lecturasRepository: Repository<Lectura>,
    @InjectRepository(Medidor)
    private medidoresRepository: Repository<Medidor>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Lectura[]> {
    return this.lecturasRepository.find({
      relations: ['medidor', 'operario'],
    });
  }

  async findByMedidor(medidorId: number): Promise<Lectura[]> {
    return this.lecturasRepository.find({
      where: { medidor: { id: medidorId } },
      relations: ['medidor', 'operario'],
      order: { fechaLectura: 'DESC' },
    });
  }

  async findUltimaLectura(medidorId: number): Promise<Lectura | null> {
    return this.lecturasRepository.findOne({
      where: { medidor: { id: medidorId } },
      relations: ['medidor'],
      order: { fechaLectura: 'DESC' },
    });
  }

  async create(lecturaData: any): Promise<Lectura> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id: lecturaData.medidorId },
      relations: ['usuario'],
    });

    if (!medidor) {
      throw new NotFoundException(`Medidor no encontrado`);
    }

    // Obtener última lectura
    const ultimaLectura = await this.findUltimaLectura(medidor.id);
    const lecturaAnterior = ultimaLectura ? ultimaLectura.lecturaActual : 0;

    // Validar que la lectura actual sea mayor a la anterior
    if (lecturaData.lecturaActual < lecturaAnterior) {
      throw new BadRequestException('La lectura actual no puede ser menor a la anterior');
    }

    // Calcular consumo en m3
    const consumoM3 = lecturaData.lecturaActual - lecturaAnterior;

    const lectura = this.lecturasRepository.create({
      ...lecturaData,
      medidor,
      lecturaAnterior,
      consumoM3,
      fechaLectura: new Date(),
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    });

    const saved = await this.lecturasRepository.save(lectura);
    return saved as unknown as Lectura;
  }

  async findOne(id: number): Promise<Lectura> {
    const lectura = await this.lecturasRepository.findOne({
      where: { id },
      relations: ['medidor', 'operario'],
    });
    
    if (!lectura) {
      throw new NotFoundException(`Lectura con ID ${id} no encontrada`);
    }
    
    return lectura;
  }

  async update(id: number, lecturaData: Partial<Lectura>): Promise<Lectura> {
    const lectura = await this.findOne(id);
    
    if (lecturaData.lecturaActual && lectura.lecturaAnterior) {
      lecturaData.consumoM3 = lecturaData.lecturaActual - lectura.lecturaAnterior;
    }
    
    Object.assign(lectura, lecturaData);
    const updated = await this.lecturasRepository.save(lectura);
    return updated;
  }

  async delete(id: number): Promise<void> {
    const lectura = await this.findOne(id);
    await this.lecturasRepository.remove(lectura);
  }
}

