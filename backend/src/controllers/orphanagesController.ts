import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import orphanageView from '../views/orphanages_view'
import * as Yup from 'yup'

import Orphanage from '../models/Orphanage'

export default {

    async index(request: Request, response: Response) {
        const orphanagesRepository = getRepository(Orphanage);

        const orphanages = await orphanagesRepository.find({
            relations: ['images']
        });

        return response.json(orphanageView.renderMany(orphanages))
    },

    async show(request: Request, response: Response) {
        const { id } = request.params;
        
        const orphanagesRepository = getRepository(Orphanage);

        const orphanage = await orphanagesRepository.findOneOrFail(id, {
            relations: ['images']
        });

        return response.json(orphanageView.render(orphanage))
    },

    async create(request: Request, response: Response) {
        const {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends
        } = request.body;

        const requestImages = request.files as Express.Multer.File[];
        const images = requestImages.map(image => {
            return { path: image.filename }
        });

        const data = {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends: open_on_weekends === 'true',
            images
        };

        const schema = Yup.object().shape({
            name: Yup.string().required(),
            latitude: Yup.number().required(),
            longitude: Yup.number().required(),
            about: Yup.string().required().max(300),
            instructions: Yup.string().required(),
            opening_hours: Yup.string().required(),
            open_on_weekends: Yup.boolean().required(),
            pending: Yup.boolean(),
            images: Yup.array(
                Yup.object().shape({
                    path: Yup.string().required()
                })
            )
        })

        await schema.validate(data, {
            abortEarly: false
        });

        const orphanagesRepository = getRepository(Orphanage);
        const orphanage = orphanagesRepository.create(data);

        await orphanagesRepository.save(orphanage);

        return response.status(201).json(orphanage);
    },

    async update(request: Request, response: Response) {
        const { id } = request.params;
        const {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends
        } = request.body;

        const requestImages = request.files as Express.Multer.File[];
        const images = requestImages.map(image => {
            return { path: image.filename }
        });

        const data = {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends: open_on_weekends === 'true',
            images
        };

        const schema = Yup.object().shape({
            name: Yup.string().required(),
            latitude: Yup.number().required(),
            longitude: Yup.number().required(),
            about: Yup.string().required().max(300),
            instructions: Yup.string().required(),
            opening_hours: Yup.string().required(),
            open_on_weekends: Yup.boolean().required(),
            pending: Yup.boolean(),
            images: Yup.array(
                Yup.object().shape({
                    path: Yup.string().required()
                })
            )
        })

        await schema.validate(data, {
            abortEarly: false
        });

        const orphanagesRepository = getRepository(Orphanage);
        const orphanage = orphanagesRepository.create(data);

        try{
            orphanagesRepository.update({ id: parseInt(id) },orphanage);
            console.log(parseInt(id));
        } catch(error) {
            return response.status(400).send('user does nos exist');
        }

        return response.status(201).json(orphanage);
    },

    async delete(request: Request, response: Response) {
        const { id } = request.params

        const orphanagesRepository = getRepository(Orphanage);
        try{
          await orphanagesRepository.findOneOrFail(id);
        } catch(error) {
          return response.status(404).send('Orphanage does not exist');
        }
        orphanagesRepository.delete(id);
        return response.status(202).send('Orphanage removed');
    },

    async acceptOrRefuse(request: Request, response: Response) {
        const { id, acceptedOrRefused } = request.body;
        const orphanagesRepository = getRepository(Orphanage);

        if(acceptedOrRefused) {
            const orphanage = new Orphanage();
            // If was accepted, pending is not more true
            orphanage.pending = false;

            orphanagesRepository.update({ id: id }, orphanage);

            return response.status(202).send('Orphanage was accepted');
        } else {
            orphanagesRepository.delete(id);

            return response.status(202).send('Orphanage was refused');
        }
    }
}