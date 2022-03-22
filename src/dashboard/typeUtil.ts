import { APIFoodCategory, APIPortionInfo, APIItem, APITimestamp, APIStation } from '../utils/session/apiTypes';
import { TimeInfo } from './state';
export enum FOOD_CATEGORY{Carbohydrates = "Carbohydrates",Protein = "Protein", Vegetable = "Vegetable"}
export enum MEAL{Breakfast = "Breakfast", Lunch = "Lunch",Dinner = "Dinner"}
export const MEALS = [MEAL.Breakfast,MEAL.Lunch, MEAL.Dinner]

export enum STATION{A = "A", B = "B", C = "C", D = "D", E = "E",F = "F"}
// export enum STATION{A = "A", B = "B", C = "C", D = "D", E = "E", F = "F", G = "G", H = "H", I = "I"}

export function getFoodCategoryDescription(fc: FOOD_CATEGORY){
    switch(fc){
        case(FOOD_CATEGORY.Carbohydrates): return "Grains"
        case(FOOD_CATEGORY.Protein): return "Proteins"
        case(FOOD_CATEGORY.Vegetable): return "Produce"
    }
}

export function getNameOfStation( station: STATION){
    return {A: "Homestyle",
            B: "Rooted",
            C: "FYUL",
            D: "FLAME",
            E: "Carved and crafted",
            F:   "500 Degrees",
            }[station] ?? null
}

export function getMealsIndex(meal:MEAL){
    switch(meal){
        case(MEAL.Breakfast): return 0 
        case(MEAL.Lunch): return 1 
        case(MEAL.Dinner): return 2 
    }
}
export interface NutritionInfo{
    sugar ?: number, //
    cholesterol ?: number, //
    dietaryFiber ?: number, //
    sodium ?: number, //
    potassium ?: number,
    calcium ?: number,
    iron ?: number,
    vitaminD ?: number,
    vitaminC ?: number,
    vitaminA ?: number,
}
export interface NutritionSummaryInfo{
    calories : number, //
    protein : number, //
    carbohydrates : number, //
    totalFat : number, // 
    saturatedFat ?: number, //
    transFat ?: number //
}

export type Ingredients = Array<number>

export interface PortionInfo{
    volume ?: number,
    fillFraction ?: number,
    nutrientFraction ?: number,
    weight ?: number,
}

export interface Dish{
    id: number,
    graphic?: string,
    name: string,
    station: STATION,
    category: FOOD_CATEGORY,
    nutrition: NutritionInfo,
    nutritionSummary: NutritionSummaryInfo
    ingredients: Ingredients,
    portion_weight: number,
    portion_volume: number,
    portion?: PortionInfo,
}
export interface MealState {
    time: TimeInfo,
    mealID: number,
    recommendationA?: Array<Dish>,
    dishA?: Dish,
    recommendationB?: Array<Dish>,
    dishB?: Dish,
    recommendationC?: Array<Dish>,
    dishC?: Dish,
    menu?: {
        dishes : Dish[]
    }
}
function getCategoryOfAPIItem(item:APIItem){
    return FoodCategoryFromAPIFoodCategory(item.category)
}

function toNum(num){
    if(isNaN(num)) return 0
    return num ?? 0 
}
export function convertAPIStationToStation(stat:APIStation){
    switch(stat){
        case APIStation.A:
            return STATION.A;
        case APIStation.B:
            return STATION.B;
        case APIStation.C:
            return STATION.C;
        case APIStation.D:
            return STATION.D;
        case APIStation.E:
            return STATION.E;
        case APIStation.F:
            return STATION.F;
        // case APIStation.G:
        //     return STATION.G;
        // case APIStation.H:
        //     return STATION.H;
        // case APIStation.I:
        //     return STATION.I;
    }
}
export function convertAPIItemToDish(item:APIItem){
    return {
        id: item.id,
        name: item.name,
        graphic : item.graphic,
        station: convertAPIStationToStation(item.station),
        category: getCategoryOfAPIItem(item),
        nutrition: {
            sugar: item.sugar,
            cholesterol: item.cholesterol,
            dietaryFiber: item.fiber,
            sodium: item.sodium,
            potassium: item.potassium,
            calcium: item.calcium,
            iron: item.calcium,
            vitaminD: item.vitamin_d,
            vitaminC: item.vitamin_c,
            vitaminA: item.vitamin_a,
        },
        nutritionSummary:{
            calories: item.calories,
            protein: item.protein,
            carbohydrates: item.carbohydrate,
            totalFat: toNum(item.saturated_fat) + toNum(item.trans_fat) + toNum(item.unsaturated_fat),
            saturatedFat: item.saturated_fat ??0,
            transFat: item.trans_fat,
        },
        ingredients: item.ingredients,
        portion_volume: item.portion_volume,
        portion_weight: item.portion_weight,
        // portion:{
        //     fillFraction:0.6,
        // }
    } as Dish
}
export function parseAPITimestamp(date:APITimestamp){
    return new Date()
}

export function mealToAPIForm(meal:MEAL){
    return meal.toLowerCase();
}

export enum Portion{
    A = "A",
    B = "B",
    C = "C"
}

export function getDishByPortion(mealState:MealState,portion:Portion){
    switch(portion){
        case(Portion.A):
            return mealState.dishA;
            break;
        case(Portion.B):
            return mealState.dishB;
            break;
        case(Portion.C):
            return mealState.dishC;
            break;
    }
}
export function setDishByPortion(mealState:MealState,portion:Portion, toSet : Dish){
    switch(portion){
        case(Portion.A):
            return {
                ...mealState,
                dishA: toSet
            }    
            break;
        case(Portion.B):
            return {
                ...mealState,
                dishB: toSet
            }    
            break;
        case(Portion.C):
            return {
                ...mealState,
                dishC: toSet
            }    
            break;
    }
}

export function getRecommendationsByPortion(mealState:MealState,portion:Portion){
    switch(portion){
        case(Portion.A):
            return mealState.recommendationA;
            break;
        case(Portion.B):
            return mealState.recommendationB
            break;
        case(Portion.C):
            return mealState.recommendationC
            break;
    }
}
export function fullVolumeByPortion(portion: Portion){
    switch(portion){
        case Portion.A:
            return 270
        case Portion.B:
            return 270
        case Portion.C:
            return 610
    }
}

export function getPortionInfoFromAPIPortionInfo(dish:Dish,info:APIPortionInfo,portion: Portion){
    return {
        fillFraction: info.volume/fullVolumeByPortion(portion),
        nutrientFraction: info.volume/dish.portion_volume,
        volume: info.volume,
        weight: info.weight,
    } as PortionInfo
}

export function FoodCategoryFromAPIFoodCategory(cat:APIFoodCategory){
    switch(cat){
        case APIFoodCategory.carbohydrate: 
            return FOOD_CATEGORY.Carbohydrates
        case APIFoodCategory.protein:
            return FOOD_CATEGORY.Protein
        case APIFoodCategory.vegetable:
            return FOOD_CATEGORY.Vegetable
    }
    console.log("Nomatch?", APIFoodCategory.carbohydrate)
}