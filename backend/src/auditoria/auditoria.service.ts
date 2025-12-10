import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditoriaRegistro,
  TipoAccionAuditoria,
} from '../entities/auditoria-registro.entity';
import { Usuario } from '../entities/usuario.entity';

export interface RegistrarAuditoriaPayload {
  usuarioId?: number;
  modulo: string;
  entidad: string;
  registroId: string | number;
  accion: TipoAccionAuditoria;
  descripcion?: string;
  datosPrevios?: Record<string, any> | null;
  datosNuevos?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface AuditoriaFiltro {
  modulo?: string;
  entidad?: string;
  registroId?: string;
  usuarioId?: number;
  accion?: TipoAccionAuditoria | string;
  desde?: Date;
  hasta?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaRegistro)
    private readonly auditoriaRepository: Repository<AuditoriaRegistro>,
  ) {}

  async registrarEvento(
    payload: RegistrarAuditoriaPayload,
  ): Promise<AuditoriaRegistro> {
    const {
      usuarioId,
      modulo,
      entidad,
      registroId,
      accion,
      descripcion,
      datosPrevios,
      datosNuevos,
      metadata,
    } = payload;

    const registro = this.auditoriaRepository.create({
      modulo: modulo.toLowerCase(),
      entidad,
      registroId: String(registroId),
      accion,
      descripcion,
      datosPrevios: datosPrevios && Object.keys(datosPrevios).length ? datosPrevios : null,
      datosNuevos: datosNuevos && Object.keys(datosNuevos).length ? datosNuevos : null,
      metadata: metadata && Object.keys(metadata).length ? metadata : null,
      usuario: usuarioId ? ({ id: usuarioId } as Usuario) : null,
    });

    return this.auditoriaRepository.save(registro);
  }

  async findAll(filtros: AuditoriaFiltro = {}): Promise<AuditoriaRegistro[]> {
    const {
      modulo,
      entidad,
      registroId,
      usuarioId,
      accion,
      desde,
      hasta,
      limit,
      offset,
    } = filtros;

    const query = this.auditoriaRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.usuario', 'usuario')
      .orderBy('log.creadoEn', 'DESC');

    if (modulo) {
      query.andWhere('log.modulo = :modulo', { modulo: modulo.toLowerCase() });
    }

    if (entidad) {
      query.andWhere('log.entidad = :entidad', { entidad });
    }

    if (registroId) {
      query.andWhere('log.registroId = :registroId', { registroId });
    }

    if (usuarioId) {
      query.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (accion) {
      query.andWhere('log.accion = :accion', { accion });
    }

    if (desde) {
      query.andWhere('log.creadoEn >= :desde', { desde });
    }

    if (hasta) {
      query.andWhere('log.creadoEn <= :hasta', { hasta });
    }

    const take = Math.min(limit ?? 100, 500);
    query.take(take);

    if (offset) {
      query.skip(offset);
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<AuditoriaRegistro> {
    const registro = await this.auditoriaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!registro) {
      throw new NotFoundException('Registro de auditoría no encontrado');
    }

    return registro;
  }
}


