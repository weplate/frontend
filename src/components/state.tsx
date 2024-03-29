import { memo, useCallback, useMemo } from 'react';
import {atom, selector, selectorFamily, SetterOrUpdater, useRecoilState, } from 'recoil'
import { lerp } from '../utils/math';
import { useUserActions } from '../utils/session/useUserActions';
import { FOOD_CATEGORY, MEAL, STATION, MealState, Dish, NutritionInfo, NutritionSummaryInfo, convertAPIItemToDish, PlateType } from './dashboard/typeUtil';
export function dateToString(date){
    if(date == null) return null
    try{
        var UTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return UTC.toISOString().slice(0, 10)
    }catch(e){
        return null
    }
}
export function stringToDate(string: string){
    if(string === null) return null
    const [year,month,day] = string.split('-')
    return new Date(Date.UTC(parseInt(year),parseInt(month)-1,parseInt(day)+1))
}

export function getTimeInfoOfNow(){
    const date = new Date()
    const date_string = dateToString(date)
    const hour = date.getHours();
    let currentMeal = MEAL.Lunch
    if(hour < 11){
        currentMeal = MEAL.Breakfast
    }
    if(hour > 12+4){
        currentMeal = MEAL.Dinner
    }
    return {
        date: date_string,
        meal: currentMeal
    } as TimeInfo
}

export const dashboardStateAtom = atom({
    key: "dashboardState",
    
    default: {
        currentDate: null,
        currentMeal: null,
        viewingDate: null,
        viewingMeal: null,
        // currentDate: stringToDate("2022-02-27"),
        // currentMeal: MEALS.Dinner,
        streakLength: 12
    }
})
export interface TimeInfo{
    date: string,
    meal: MEAL,
}

function randomSelect(...items){
    return items[Math.floor(Math.random()*items.length)];
}
function randomNumber(max){
    return Math.floor(Math.random()*max/2)+max/2
}

// function randomDish(){
//     const name_modifier = randomSelect("","","","","","","","Chopped","Stir fried","Spanish","Seared","Swedish","Japanese","French","Fried","Stewed","Braised","Sliced","Flambéed","Deviled","Baked","Fresh","Boiled","Million Dollar") 
//     let name_item = "Rice"
//     const category : FOOD_CATEGORY= randomSelect(FOOD_CATEGORY.Carbohydrates,FOOD_CATEGORY.Protein,FOOD_CATEGORY.Vegetable) 
//     if(category === FOOD_CATEGORY.Carbohydrates){
//         name_item = randomSelect("Curry","Rice","Ravioli","Pizza","Potatoes","Ramen","Spaghetti","Lasagna")
//     }if(category === FOOD_CATEGORY.Protein){
//         name_item = randomSelect( "Chicken","Tuna","Salmon","Eggs","Meatballs","Burger","Cheese")
//     }if(category === FOOD_CATEGORY.Vegetable){
//         name_item = randomSelect("Cauliflower","Spinach","Salad","Tomato","Broccoli","Brussels Sprouts")
//     }
//     const name = name_modifier.length > 0 ? name_modifier +" "+name_item : name_item
//     const station : STATION= randomSelect(STATION.A,STATION.B,STATION.C,STATION.D)
//     const nutrition:NutritionInfo = {
//         sugar: randomNumber(100),
//         cholesterol :randomNumber(50),
//         dietaryFiber :randomNumber(50),
//         sodium :randomNumber(50),
//         potassium :randomNumber(50),
//         calcium :randomNumber(50),
//         iron :randomNumber(50),
//         vitaminD :randomNumber(50),
//         vitaminC :randomNumber(50),
//         vitaminA :randomNumber(50),
//     }
//     const summary: NutritionSummaryInfo = {
//         calories :randomNumber(400),
//         protein : randomNumber(100),
//         carbohydrates : randomNumber(100),
//         totalFat : randomNumber(100),
//         saturatedFat : randomNumber(100),
//         transFat :randomNumber(100),
//     }
//     return {
//         id: 10,
//         name,
//         station,
//         category,
//         nutrition,
//         nutritionSummary: summary,
//         ingredients: [],
//         portion: {
//             fillFraction: Math.random(),
//             weight: lerp(100,200,Math.random()),
               
//         }
//     } as Dish
// }
export const mealStatesAtom = atom({
    key: "mealStateKeys",
    default: {}
})

export function timeInfoOf(date:Date,meal: MEAL){
    return {date: dateToString(date), meal: meal} as TimeInfo
}

export const mealStateSelector = selectorFamily<MealState,{date:string,meal:string}>({
    key: "mealStateSelector",
    get: (timeInfo:TimeInfo) => ({get})=>{
        const date = stringToDate(timeInfo.date)
        const meal = timeInfo.meal
        const key = `mealState:${dateToString(date)}:${meal}`
        return get(mealStatesAtom)?.[key]
    },
    set: (timeInfo: TimeInfo) => ({get,set},newState)=>{
        const date = stringToDate(timeInfo.date)
        const meal = timeInfo.meal
        const key = `mealState:${dateToString(date)}:${meal}`
        set(mealStatesAtom, {
            ... get(mealStatesAtom),
            [key]: newState
        })
    }
})

export function useMealStateUtils(){
    
    const [mealStates,setMealStates] = useRecoilState(mealStatesAtom)
    const getMealState =  (timeInfo:TimeInfo) => {
        const [mealState,setMealState] = useRecoilState(mealStateSelector(timeInfo))
       
        if(mealState != null) return [mealState,setMealState]  as [MealState,SetterOrUpdater<MealState>]
        const NUM_PER_REC = 5
        // function makeRecommendationList(){
        //     let list = []
        //     for(let i =0 ; i< NUM_PER_REC;i++){
        //         list.push(randomDish() as Dish)
        //     }
        //     return list as Array<Dish>
        // }
        // //todo: fetch defaults and stuff

        // const recA = makeRecommendationList()
        // const recB = makeRecommendationList()
        // const recC = makeRecommendationList()
        const state : MealState = {
            time: timeInfo,
            mealID: null,
            recommendationA: null,
            dishA: null,
            recommendationB: null,
            dishB: null,
            recommendationC: null,
            dishC: null,
        }
        setMealState(state)
        return [state,setMealState] as [MealState,SetterOrUpdater<MealState>]
    }
    return {getMealState}

}
// export const mealStateFromTimeInfo = (timeInfo:TimeInfo) => mealStateWithDateMeal( )

// export const useMealState = ()