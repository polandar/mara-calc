import math

class RaceCondition:
    AVERAGE = 0
    FAST = 1
    DIFFICULT = 2

class RaceDistance:
    FIVE_K = 0
    FIVE_M = 1
    TEN_K = 2
    TEN_M = 3
    HALF_MARA = 4

class Predictor:
    adjustment_factor = {
        RaceDistance.FIVE_K:{
            RaceCondition.FAST: -0.0237814322487082,
            RaceCondition.DIFFICULT: 0.1129432382020499,
        },
        RaceDistance.FIVE_M:{
            RaceCondition.FAST: -0.1549942921949754,
            RaceCondition.DIFFICULT: 0.1089566001045939,
        },
        RaceDistance.TEN_K:{
            RaceCondition.FAST: -0.0780677777771365,
            RaceCondition.DIFFICULT: 0.024557694615445,
        },
        RaceDistance.TEN_M:{
            RaceCondition.FAST: -0.1358099643292151,
            RaceCondition.DIFFICULT: 0.1030755530328555,
        },
        RaceDistance.HALF_MARA:{
            RaceCondition.FAST: -0.0978322644420439,
            RaceCondition.DIFFICULT: 0.0335971859175381,
        },
    }

    race_distance_meters = {
        RaceDistance.FIVE_K: 5000,
        RaceDistance.FIVE_M: 8045,
        RaceDistance.TEN_K: 10000,
        RaceDistance.TEN_M: 16090,
        RaceDistance.HALF_MARA: 21098,
    }

    @classmethod
    def get_adjusted_time(cls, time: int, distance: RaceDistance, conditions: RaceCondition)-> float:
        if conditions == RaceCondition.AVERAGE:
            return float(time)
        adj_factor = cls.adjustment_factor[distance][conditions]
        dist_m = cls.race_distance_meters[distance]
        adj_time = 1.0*dist_m/(dist_m/time + adj_factor)
        return adj_time

    @classmethod
    def single_race(cls, time: int, distance: RaceDistance, conditions: RaceCondition, mileage: int) -> float:
        if time == 0:
            return 0
        adj_time = cls.get_adjusted_time(time, distance, conditions)
        v_rieg = 42195.0/(adj_time*(42195/cls.race_distance_meters[distance])**1.07)
        v_model = 0.16018617 + (0.83076202*v_rieg) + (0.06423826*(mileage/10))
        m_time = (42195.0/60)/v_model
        return m_time

    @classmethod
    def multi_race(cls, time: int, distance: RaceDistance, conditions: RaceCondition, time2: int, distance2: RaceDistance, conditions2: RaceCondition, mileage: int) -> float:
        if time == 0:
            return 0
        adj_time = cls.get_adjusted_time(time, distance, conditions)
        dist = cls.race_distance_meters[distance]
        adj_time2 = cls.get_adjusted_time(time2, distance2, conditions2)
        print(adj_time, adj_time2)
        dist2 = cls.race_distance_meters[distance2]
        k = math.log(adj_time2/adj_time)/math.log(dist2/dist)
        print(k)
        k_mara = 1.4510756 - 0.23797948*k - 0.01410023*mileage/10
        print(k_mara)
        m_time = adj_time2*((42195/dist2)**k_mara)/60.0
        return m_time

def main():
    print(Predictor.single_race(2400, RaceDistance.TEN_K, RaceCondition.FAST, 0))
    print(Predictor.multi_race(1140, RaceDistance.FIVE_K, RaceCondition.AVERAGE, 5400, RaceDistance.HALF_MARA, RaceCondition.AVERAGE, 0))
    return 0

if __name__ == "__main__":
    main()