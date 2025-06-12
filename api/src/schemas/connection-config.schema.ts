// Em api/src/app/schemas/connection-config.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ConnectionConfigDocument = HydratedDocument<ConnectionConfig>;

@Schema({ timestamps: true }) // `timestamps` adiciona os campos createdAt e updatedAt automaticamente
export class ConnectionConfig {
  @Prop({ required: true, unique: true, trim: true })
  connectionId!: string;

  @Prop({ required: true, default: true })
  enabled!: boolean;

  @Prop({ required: true, enum: ['client', 'server'] })
  connectionType!: string;

  @Prop({ trim: true })
  host?: string; // O '?' torna o campo opcional (necessário para o tipo 'server')

  @Prop({ required: true })
  port!: number;

  @Prop({ required: true, trim: true })
  sendQueue!: string;

  @Prop({ required: true, trim: true })
  receiveQueue!: string;

  // Um campo flexível para guardar configurações extras no futuro
  @Prop({ type: MongooseSchema.Types.Mixed })
  options?: Record<string, any>;
}

export const ConnectionConfigSchema = SchemaFactory.createForClass(ConnectionConfig);