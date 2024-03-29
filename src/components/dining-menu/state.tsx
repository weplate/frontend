import { atom } from "recoil"
import { MealState, convertAPIItemToDish, Portion, getPortionInfoFromAPIPortionInfo, Dish, FOOD_CATEGORY, FoodCategoryFromAPIFoodCategory, getMealsIndex, getDishesByPortion } from '../dashboard/typeUtil';
import { TimeInfo } from '../state';
export const diningMenuState = atom({
    key: "diningMenuState",
    
    default: {
        dishes: null as Array<Dish>,
        timeInfo: null as TimeInfo,
    }
})