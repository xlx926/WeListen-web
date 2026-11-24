from flask import Blueprint, request
from project.services.ranking_service import RankingService
from project.utils.auth import login_required, current_user_id
from project.utils.response import success

ranking_bp = Blueprint("rankings", __name__)
ranking_service = RankingService()


@ranking_bp.route("/weekly", methods=["GET"])
def weekly():
    limit = min(int(request.args.get("limit", 50)), 100)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    return success(ranking_service.get_weekly_hot(limit, start_date, end_date))


@ranking_bp.route("/monthly", methods=["GET"])
def monthly():
    limit = min(int(request.args.get("limit", 50)), 100)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    return success(ranking_service.get_monthly_hot(limit, start_date, end_date))


@ranking_bp.route("/all-time", methods=["GET"])
def all_time():
    limit = min(int(request.args.get("limit", 50)), 100)
    return success(ranking_service.get_all_time_by_play_count(limit))


@ranking_bp.route("/weight", methods=["GET"])
def weight():
    limit = min(int(request.args.get("limit", 50)), 100)
    return success(ranking_service.get_weight_ranking(limit))


@ranking_bp.route("/my-stats", methods=["GET"])
@login_required
def my_stats():
    days = min(int(request.args.get("days", 30)), 365)
    return success(ranking_service.get_user_play_stats(current_user_id(), days))
