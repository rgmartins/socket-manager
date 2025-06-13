// Em api/src/app/schemas/connection-config.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ConnectionConfigDocument = HydratedDocument<ConnectionConfig>;

@Schema({ timestamps: true })
export class ConnectionConfig {
  @Prop({ required: true, unique: true, trim: true })
  connectionId!: string;

  @Prop({ required: true, default: true })
  enabled!: boolean;

  @Prop({ required: true, enum: ['client', 'server'] })
  connectionType!: string;

  @Prop({ trim: true })
  host?: string;

  @Prop({ required: true })
  port!: number;

  // CAMPO NOVO:
  @Prop({ required: true, unique: true, trim: true })
  queueBaseName!: string;

  // CAMPOS REMOVIDOS: sendQueue e receiveQueue

  @Prop({ type: MongooseSchema.Types.Mixed })
  options?: Record<string, any>;
}

export const ConnectionConfigSchema = SchemaFactory.createForClass(ConnectionConfig);