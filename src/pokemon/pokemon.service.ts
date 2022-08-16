import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  
  @InjectModel(Pokemon.name)
  private readonly pokemonModel: Model<Pokemon>
  
  async create(createPokemonDto: CreatePokemonDto) {
    try{
      createPokemonDto.name=createPokemonDto.name.toLocaleLowerCase();
      const pokemon=await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    }catch(err){
      this.handleExceptions(err);
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string) {
    
    let pokemon: Pokemon;

    if(!isNaN(+term)){
      pokemon=await this.pokemonModel.findOne({no: term});
      return pokemon;
    }    

    //(isMongoId(term)) 
    isValidObjectId(term)
      ? pokemon=await this.pokemonModel.findById(term)
      : pokemon=await this.pokemonModel.findOne({name: term.toLowerCase().trim()})

    if(!pokemon)
      throw new NotFoundException(`Pokemon not found ${term}`)
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon=await this.findOne(term);
    if(!pokemon)
      throw new NotFoundException(`parameter Pokemon ${term} isn't in DataBase`)
    try{      
      if(updatePokemonDto.name)
          updatePokemonDto.name=updatePokemonDto.name.toLowerCase();
      await pokemon.updateOne(updatePokemonDto);
    }catch(err){
      this.handleExceptions(err);
    }
    return {...pokemon.toJSON(), ...updatePokemonDto}

  }   

  async remove(id: string) {
    //const result=this.pokemonModel.findByIdAndDelete(id);
    const {deletedCount}=await this.pokemonModel.deleteOne({_id: id});
    if(deletedCount===0)
    throw new BadRequestException(`Pokemon with id "${id}" not found`)
    return;
  }
  
  private handleExceptions(err: any){
    if(err.code==11000){
      throw new BadRequestException(`Termino exists in db ${JSON.stringify(err.keyValue)}`)
    }
    console.log('el error es ', err)
    throw new InternalServerErrorException(`Can't create Pokemon- Check server logs`)
  }
}
