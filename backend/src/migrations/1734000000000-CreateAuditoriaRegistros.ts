import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAuditoriaRegistros1734000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auditoria_registros',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'modulo',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'entidad',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'registroId',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'accion',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'descripcion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'datosPrevios',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'datosNuevos',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'usuarioId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'creadoEn',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear foreign key hacia usuarios
    await queryRunner.createForeignKey(
      'auditoria_registros',
      new TableForeignKey({
        columnNames: ['usuarioId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usuarios',
        onDelete: 'SET NULL',
      }),
    );

    // Crear índices para mejorar performance de consultas
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_modulo" ON "auditoria_registros" ("modulo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_entidad" ON "auditoria_registros" ("entidad")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_registroId" ON "auditoria_registros" ("registroId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_accion" ON "auditoria_registros" ("accion")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auditoria_creadoEn" ON "auditoria_registros" ("creadoEn")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_creadoEn"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_accion"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_registroId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_entidad"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auditoria_modulo"`);

    // Eliminar la tabla (las FK se eliminan automáticamente en cascade)
    await queryRunner.dropTable('auditoria_registros');
  }
}

