import {useState,useEffect} from 'react'
import { View,Text, StyleSheet,TouchableOpacity, Dimensions,Animated } from "react-native"
import { SvgXml } from "react-native-svg"
import { PanGestureHandler } from 'react-native-gesture-handler'
import { closest, interp } from "../../utils/math"
import { SHADOW_STYLE } from './Dashboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { interpolateRotationRadians } from '../../utils/Loading'

export const ARROW_ICON_SVG = `<svg width="31" height="11" viewBox="0 0 31 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 9L16.8042 2.62964C15.9802 2.23184 15.0198 2.23184 14.1958 2.62964L1 9" stroke="#A4A4A4" stroke-width="4"/>
</svg>
`

// '<svg width="30" height="18" viewBox="0 0 30 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.2019 15.101L15.101 3.00003L3.00007 15.101" stroke="#C2C2C2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export const NutritionFactsContainerHiddenHeight = 70
const NutritionFactsContainer = (props) =>{
    const ALLOW_OPEN = !(props?.disabled ?? false);

    const dim = Dimensions.get('window')
    const insets = useSafeAreaInsets()
    const HIDDEN_HEIGHT = NutritionFactsContainerHiddenHeight
    const SUFFICIENT_HIDE_LEVEL_GOING_UP = 0.1
    const SUFFICIENT_HIDE_LEVEL_GOING_DOWN = 0.8
    const TOP_Y = 0
    const BOTTOM_Y = dim.height-HIDDEN_HEIGHT -120 - insets.top
    const [userSliding,setUserSliding] = useState(false)
    const [targetYValue,setTargetYValue] = useState(BOTTOM_Y)
    const [yValue,setYValue] = useState(new Animated.Value(BOTTOM_Y))
    // const [hideLevel,setHideLevel] = useState(new Animated.Value(0))
    useEffect(()=>{
        if(!ALLOW_OPEN){
            animateBottom()
        }
    },[ALLOW_OPEN])

    const hideLevel = yValue.interpolate({
        inputRange: [TOP_Y,BOTTOM_Y],
        outputRange: [1,0], 
    })
    const hideLevelValue = ()=>{
        return interp(TOP_Y,BOTTOM_Y,1,0,yValue._value)
    }
    const colorInterp  = hideLevel.interpolate({
        inputRange: [0,1],
        outputRange: ['rgba(0,0,0,0)','rgba(0,0,0,0.5)']
    })
    
    const onGestureEvent = (event)=>{
        let {nativeEvent} = event
        // console.log(nativeEvent)
        if(ALLOW_OPEN){
            yValue.stopAnimation()
            yValue.setValue(nativeEvent.absoluteY-120-20)
            setUserSliding(true)
        }
    }

    function animateBottom(){
        setTargetYValue(BOTTOM_Y)
            Animated.timing(yValue,{
                toValue:BOTTOM_Y,
                duration: 200,
                useNativeDriver: false,
            }).start()
    }
    const onEnded = () =>{
        setUserSliding(false)
        const _hideLevel = hideLevelValue()
        let sufficientHideLevel = SUFFICIENT_HIDE_LEVEL_GOING_UP
        if(closest(targetYValue,[TOP_Y,BOTTOM_Y])== TOP_Y){
            // console.log("GOIN DOWN")
            sufficientHideLevel = SUFFICIENT_HIDE_LEVEL_GOING_DOWN
        }
        if(_hideLevel>sufficientHideLevel){
            setTargetYValue(TOP_Y)
            Animated.timing(yValue,{
                toValue:TOP_Y,
                duration: 200,
                useNativeDriver:false,
            }).start()
        }else{
            animateBottom()
        }
    }
    return <>
        <Animated.View pointerEvents= 'none' style = {{
            position:"absolute",
            top: -50,
            width: dim.width,
            height: dim.height,
            backgroundColor: colorInterp,
        }}/>
        
        <Animated.View style = {{
            width: dim.width,
            height: dim.height //- TOP_Y - insets.top - 120
            ,
            paddingBottom: TOP_Y + insets.top + 120,
            // maxHeight: dim.height-TOP_Y,
            ...SHADOW_STYLE,
            alignItems: 'center',
            position: 'absolute',
           
            // borderRadius:30,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            transform: [{translateY: yValue}],
        }}>
            <PanGestureHandler activeOffsetY={[-20,20]} onGestureEvent = {onGestureEvent} onEnded = {onEnded}>
                <View style = {{
                    // backgroundColor: "orange",
                    height : HIDDEN_HEIGHT,
                    width: '100%',
                    paddingTop: 15,
                    marginBottom:5,

                    alignItems: 'center',
                }}>
                    <TouchableOpacity style = {{
                        alignItems:'center'
                    }}
                    onPress = {(event)=>{
                        if(ALLOW_OPEN){
                            if(closest(targetYValue,[TOP_Y,BOTTOM_Y])== BOTTOM_Y){
                                setTargetYValue(TOP_Y)
                                Animated.timing(yValue,{
                                    toValue:TOP_Y,
                                    duration: 400,
                                    useNativeDriver:false,
                                }).start()
                            }else{
                                setTargetYValue(BOTTOM_Y)
                                Animated.timing(yValue,{
                                    toValue:BOTTOM_Y,
                                    duration: 400,
                                    useNativeDriver: false,
                                }).start()
                            }
                        }
                    }}>
                        <Animated.View style = {{
                            transform : [{rotate: interpolateRotationRadians(hideLevel.interpolate({inputRange:[0,1],outputRange:[0,Math.PI],extrapolate:"clamp"}))}]
                        }}>
                            <SvgXml xml = {ARROW_ICON_SVG}/>
                        </Animated.View>
                        <Animated.Text style = {{
                            marginTop:4,
                            color: "#A4A4A4",
                            fontSize: 20,
                        }}>
                            Nutrition Facts
                        </Animated.Text>
                    </TouchableOpacity>
                </View>
            </PanGestureHandler>
            <View style = {{
                flex:1,
                alignSelf : "flex-start",
            }}>
                { ( (closest(targetYValue,[TOP_Y,BOTTOM_Y])== TOP_Y) || true) && props.children}
            </View>
        </Animated.View>
    </>
}

export default NutritionFactsContainer